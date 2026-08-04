import { AuditAction, CertificationApplicationStatus, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { certificationSubmissionSchema, type CertificationDraftInput, type CertificationReviewInput, type CertificationWorkflowInput } from "./certification-application.schema";

interface Owner { readonly userId: string; readonly businessId: bigint }

const applicationInclude = {
  business: { select: { name: true } }, applicant: { select: { profile: { select: { fullName: true } } } }, reviewer: { select: { profile: { select: { fullName: true } } } },
  documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" as const }, select: { id: true, documentType: true, documentName: true, originalFileName: true, mimeType: true, fileSize: true, createdAt: true } },
  conformityStandards: { orderBy: { createdAt: "asc" as const }, select: { rujukanSni: { select: { id: true, judulStandar: true, nomorSni: true } } } },
  statusHistory: { orderBy: { createdAt: "desc" as const }, select: { id: true, status: true, notes: true, createdAt: true, actor: { select: { profile: { select: { fullName: true } } } } } },
};

type ApplicationRecord = Prisma.CertificationApplicationGetPayload<{ include: typeof applicationInclude }>;

function serialize(application: ApplicationRecord) {
  return { ...application, id: application.id.toString(), businessId: application.businessId.toString(), applicantUserId: application.applicantUserId.toString(), reviewedById: application.reviewedById?.toString() ?? null,
    documents: application.documents.map((item) => ({ ...item, id: item.id.toString(), fileSize: item.fileSize.toString(), createdAt: item.createdAt.toISOString() })),
    conformityStandards: application.conformityStandards.map(({ rujukanSni }) => ({ ...rujukanSni, id: rujukanSni.id.toString() })),
    statusHistory: application.statusHistory.map((item) => ({ ...item, id: item.id.toString(), createdAt: item.createdAt.toISOString() })), createdAt: application.createdAt.toISOString(), updatedAt: application.updatedAt.toISOString(), submittedAt: application.submittedAt?.toISOString() ?? null, reviewedAt: application.reviewedAt?.toISOString() ?? null };
}

export async function getApplicantSnapshot(owner: Owner) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: BigInt(owner.userId) }, select: { phone: true, normalizedPhone: true, profile: { select: { fullName: true, employeeNumber: true, positionTitle: true } } } });
  const business = await prisma.business.findUniqueOrThrow({ where: { id: owner.businessId }, select: { name: true, profile: { select: { nib: true, taxNumber: true, addressLine: true, phone: true, email: true, picPosition: true, village: { select: { name: true } }, district: { select: { name: true } }, regency: { select: { name: true } }, province: { select: { name: true } } } } } });
  const profile = business.profile;
  return { applicantName: user.profile?.fullName ?? "", upiName: business.name, identityNumber: profile?.nib ?? profile?.taxNumber ?? user.profile?.employeeNumber ?? "", address: [profile?.addressLine, profile?.village?.name, profile?.district?.name, profile?.regency.name, profile?.province.name].filter(Boolean).join(", "), phone: profile?.phone ?? user.phone ?? user.normalizedPhone ?? "", email: profile?.email ?? "", position: user.profile?.positionTitle ?? profile?.picPosition ?? "" };
}

export async function listCertificationApplications(owner?: Owner) {
  const rows = await prisma.certificationApplication.findMany({ where: { deletedAt: null, ...(owner ? { businessId: owner.businessId } : {}) }, orderBy: { updatedAt: "desc" }, include: applicationInclude });
  return rows.map(serialize);
}

export async function getCertificationApplication(id: bigint, owner?: Owner) {
  const application = await prisma.certificationApplication.findFirst({ where: { id, deletedAt: null, ...(owner ? { businessId: owner.businessId } : {}) }, include: applicationInclude });
  if (!application) throw new Error("NOT_FOUND");
  return serialize(application);
}

export async function saveCertificationDraft(owner: Owner, input: CertificationDraftInput, context: RequestContext, id?: bigint) {
  return prisma.$transaction(async (transaction) => {
    const standardIds = [...new Set(input.productInformation.rujukanSniIds)].map(BigInt);
    const standards = await transaction.rujukanSni.findMany({ where: { id: { in: standardIds }, isActive: true, deletedAt: null }, select: { id: true, judulStandar: true, nomorSni: true } });
    if (standards.length !== standardIds.length) throw new Error("INVALID_SNI_REFERENCE");
    const pempekSelected = standards.some((standard) => standard.nomorSni === "SNI 7661:2019");
    if (pempekSelected && input.productInformation.pempekTypes.length === 0) throw new Error("PEMPEK_TYPE_REQUIRED");
    const productInformation = { ...input.productInformation, conformityStandard: standards.map((standard) => `${standard.judulStandar} — ${standard.nomorSni}`).join(", "), pempekTypes: pempekSelected ? input.productInformation.pempekTypes : [] };
    const data = { type: input.type, contactPerson: input.contactPerson, certificateRecipient: input.recipientSameAsApplicant ? Prisma.JsonNull : input.certificateRecipient ?? Prisma.JsonNull, productInformation, manufacturingInformation: input.manufacturingInformation, requirementsAccepted: input.requirementsAccepted, licenseAgreementAccepted: input.licenseAgreementAccepted };
    const isNew = id === undefined;
    if (id) {
      const current = await transaction.certificationApplication.findFirst({ where: { id, businessId: owner.businessId, status: { in: [CertificationApplicationStatus.DRAFT, CertificationApplicationStatus.REVISION_REQUIRED] }, deletedAt: null }, select: { id: true } });
      if (!current) throw new Error("INVALID_STATUS");
      await transaction.certificationApplication.update({ where: { id }, data });
      await transaction.certificationApplicationSni.deleteMany({ where: { applicationId: id } });
      if (standardIds.length) await transaction.certificationApplicationSni.createMany({ data: standardIds.map((rujukanSniId) => ({ applicationId: id as bigint, rujukanSniId })) });
    } else {
      const applicantSnapshot = await getApplicantSnapshot(owner);
      const created = await transaction.certificationApplication.create({ data: { ...data, businessId: owner.businessId, applicantUserId: BigInt(owner.userId), applicantSnapshot } });
      id = created.id;
      await transaction.certificationApplication.update({ where: { id }, data: { applicationNumber: `CERT-${new Date().getFullYear()}-${id.toString().padStart(6, "0")}` } });
      await transaction.certificationApplicationHistory.create({ data: { applicationId: id, status: "DRAFT", actorUserId: BigInt(owner.userId) } });
      if (standardIds.length) await transaction.certificationApplicationSni.createMany({ data: standardIds.map((rujukanSniId) => ({ applicationId: id as bigint, rujukanSniId })) });
    }
    await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: isNew ? AuditAction.CREATE : AuditAction.UPDATE, entityType: "CERTIFICATION_APPLICATION", entityId: id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return id;
  });
}

export async function submitCertificationApplication(owner: Owner, id: bigint, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.certificationApplication.findFirst({ where: { id, businessId: owner.businessId, status: { in: ["DRAFT", "REVISION_REQUIRED"] }, deletedAt: null }, select: { type: true, status: true, contactPerson: true, certificateRecipient: true, productInformation: true, manufacturingInformation: true, requirementsAccepted: true, licenseAgreementAccepted: true, conformityStandards: { select: { rujukanSni: { select: { id: true, nomorSni: true } } } }, documents: { where: { deletedAt: null }, select: { documentType: true } } } });
    if (!current) throw new Error("INVALID_STATUS");
    if (!current.requirementsAccepted || !current.licenseAgreementAccepted) throw new Error("DECLARATION_REQUIRED");
    const complete = certificationSubmissionSchema.safeParse({ type: current.type, contactPerson: current.contactPerson, recipientSameAsApplicant: current.certificateRecipient === null, certificateRecipient: current.certificateRecipient ?? undefined, productInformation: current.productInformation, manufacturingInformation: current.manufacturingInformation, requirementsAccepted: current.requirementsAccepted, licenseAgreementAccepted: current.licenseAgreementAccepted });
    if (!complete.success) throw new Error("APPLICATION_INCOMPLETE");
    const pempekSelected = current.conformityStandards.some(({ rujukanSni }) => rujukanSni.nomorSni === "SNI 7661:2019");
    if (pempekSelected && complete.data.productInformation.pempekTypes.length === 0) throw new Error("PEMPEK_TYPE_REQUIRED");
    const requiredDocuments = ["APPLICANT_IDENTITY", "APPLICANT_TAX_ID", "BUSINESS_LEGALITY", "QUALITY_GUIDE", "BUSINESS_CERTIFICATES", "SNI_MARK_ILLUSTRATION"];
    if (requiredDocuments.some((type) => !current.documents.some((document) => document.documentType === type))) throw new Error("DOCUMENT_REQUIRED");
    const status = current.status === "DRAFT" ? CertificationApplicationStatus.SUBMITTED : CertificationApplicationStatus.RESUBMITTED;
    await transaction.certificationApplication.update({ where: { id }, data: { status, submittedAt: new Date(), reviewNotes: null } });
    await transaction.certificationApplicationHistory.create({ data: { applicationId: id, status, actorUserId: BigInt(owner.userId), notes: current.status === "DRAFT" ? "Permohonan diajukan." : "Perbaikan diajukan kembali." } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: AuditAction.STATUS_CHANGE, entityType: "CERTIFICATION_APPLICATION", entityId: id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { status } } });
  });
}

export async function reviewCertificationApplication(userId: string, id: bigint, input: CertificationReviewInput, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.certificationApplication.findFirst({ where: { id, status: { in: ["SUBMITTED", "RESUBMITTED"] }, deletedAt: null }, select: { businessId: true } });
    if (!current) throw new Error("INVALID_STATUS");
    const status = CertificationApplicationStatus[input.decision];
    await transaction.certificationApplication.update({ where: { id }, data: { status, reviewNotes: input.notes || null, reviewedById: BigInt(userId), reviewedAt: new Date() } });
    await transaction.certificationApplicationHistory.create({ data: { applicationId: id, status, notes: input.notes || null, actorUserId: BigInt(userId) } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: current.businessId, action: input.decision === "VERIFIED" ? AuditAction.APPROVE : AuditAction.REJECT, entityType: "CERTIFICATION_APPLICATION", entityId: id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { notes: input.notes } } });
  });
}

export async function processCertificationWorkflow(userId: string, id: bigint, input: CertificationWorkflowInput, isReviewer: boolean, businessId: bigint | undefined, context: RequestContext) {
  const reviewerActions = ["ISSUE_INVOICE", "VERIFY_PAYMENT", "SCHEDULE_AUDIT", "RECORD_AUDIT", "VERIFY_CORRECTIVE_ACTION"];
  if (reviewerActions.includes(input.action) !== isReviewer) throw new Error("FORBIDDEN");
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.certificationApplication.findFirst({
      where: { id, deletedAt: null, ...(businessId ? { businessId } : {}) },
      select: { businessId: true, status: true, documents: { where: { deletedAt: null }, select: { documentType: true } } },
    });
    if (!current) throw new Error("NOT_FOUND");
    let status: CertificationApplicationStatus;
    let data: Prisma.CertificationApplicationUpdateInput;
    let notes: string;
    switch (input.action) {
      case "ISSUE_INVOICE":
        if (current.status !== "VERIFIED") throw new Error("INVALID_STATUS");
        status = CertificationApplicationStatus.INVOICED; data = { feeDetails: input.feeDetails, proposedEvaluators: input.proposedEvaluators }; notes = "Rincian biaya dan usulan tim evaluator diterbitkan."; break;
      case "SUBMIT_PAYMENT":
        if (current.status !== "INVOICED" || !current.documents.some((item) => item.documentType === "PAYMENT_PROOF")) throw new Error("PAYMENT_PROOF_REQUIRED");
        status = CertificationApplicationStatus.PAYMENT_SUBMITTED; data = { paymentSubmittedAt: new Date() }; notes = "Bukti pembayaran diajukan."; break;
      case "VERIFY_PAYMENT":
        if (current.status !== "PAYMENT_SUBMITTED") throw new Error("INVALID_STATUS");
        status = CertificationApplicationStatus.PAYMENT_VERIFIED; data = { paymentVerifiedAt: new Date(), assignedEvaluators: input.assignedEvaluators }; notes = input.notes || "Pembayaran diverifikasi dan tim evaluator ditetapkan."; break;
      case "SCHEDULE_AUDIT":
        if (current.status !== "PAYMENT_VERIFIED") throw new Error("INVALID_STATUS");
        status = CertificationApplicationStatus.AUDIT_SCHEDULED; data = { auditSchedule: input.auditSchedule }; notes = "Jadwal audit disampaikan kepada pelaku usaha."; break;
      case "CONFIRM_SCHEDULE":
        if (current.status !== "AUDIT_SCHEDULED") throw new Error("INVALID_STATUS");
        status = CertificationApplicationStatus.SCHEDULE_CONFIRMED; data = { scheduleConfirmedAt: new Date() }; notes = "Jadwal audit dikonfirmasi pelaku usaha."; break;
      case "RECORD_AUDIT":
        if (current.status !== "SCHEDULE_CONFIRMED") throw new Error("INVALID_STATUS");
        status = input.auditReport.hasNonconformity ? CertificationApplicationStatus.CORRECTIVE_ACTION_REQUIRED : CertificationApplicationStatus.AUDIT_COMPLETED;
        data = { auditReport: input.auditReport, correctiveActionNotes: input.auditReport.hasNonconformity ? input.auditReport.nonconformityDetails : null }; notes = "Hasil audit dicatat."; break;
      case "SUBMIT_CORRECTIVE_ACTION":
        if (current.status !== "CORRECTIVE_ACTION_REQUIRED" || !current.documents.some((item) => item.documentType === "CORRECTIVE_ACTION_PROOF")) throw new Error("CORRECTIVE_PROOF_REQUIRED");
        status = CertificationApplicationStatus.CORRECTIVE_ACTION_SUBMITTED; data = { correctiveActionNotes: input.notes }; notes = "Bukti tindakan perbaikan diajukan."; break;
      case "VERIFY_CORRECTIVE_ACTION":
        if (current.status !== "CORRECTIVE_ACTION_SUBMITTED") throw new Error("INVALID_STATUS");
        status = input.accepted ? CertificationApplicationStatus.CORRECTIVE_ACTION_VERIFIED : CertificationApplicationStatus.CORRECTIVE_ACTION_REQUIRED;
        data = { correctiveActionNotes: input.notes, correctiveActionVerifiedAt: input.accepted ? new Date() : null }; notes = input.notes; break;
    }
    await transaction.certificationApplication.update({ where: { id }, data: { ...data, status } });
    await transaction.certificationApplicationHistory.create({ data: { applicationId: id, status, notes, actorUserId: BigInt(userId) } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: current.businessId, action: AuditAction.STATUS_CHANGE, entityType: "CERTIFICATION_APPLICATION", entityId: id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { action: input.action, status } } });
  });
}
