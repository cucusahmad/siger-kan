import { AuditAction, CertificationApplicationStatus, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { certificationQuestionnaireSubmissionSchema, type CertificationQuestionnaireInput } from "./certification-questionnaire.schema";
import { certificationSubmissionSchema } from "./certification-application.schema";

interface Owner { readonly userId: string; readonly businessId: bigint }
const toJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
function legalityDocumentIds(input: CertificationQuestionnaireInput): bigint[] {
  const legality = input.businessLegality;
  const documents = [legality.investment, legality.establishment, legality.industrialLicense, legality.npwp, ...(Array.isArray(legality.amendments) ? legality.amendments : [])];
  return [...new Set(documents.flatMap((document) => { const file = document && typeof document === "object" ? (document.file as Record<string, unknown> | undefined) : undefined; return typeof file?.id === "string" && /^\d+$/.test(file.id) ? [file.id] : []; }))].map(BigInt);
}

function data(input: CertificationQuestionnaireInput) {
  return {
    applicantInformation: toJson(input.applicantInformation), productInformation: toJson(input.productInformation), productionInformation: toJson(input.productionInformation),
    businessLegality: toJson(input.businessLegality), humanResources: toJson(input.humanResources), certificationsAndProducts: toJson(input.certificationsAndProducts),
    marketingChannels: toJson(input.marketingChannels), qualitySystemAnswers: toJson(input.qualitySystemAnswers), sniEvaluation: toJson(input.sniEvaluation),
    otherNotes: input.otherNotes, declarationAccepted: input.declarationAccepted, signatoryName: input.signatoryName, signatoryPosition: input.signatoryPosition,
    approvalDate: input.approvalDate ? new Date(`${input.approvalDate}T00:00:00.000Z`) : null, electronicSignatureAccepted: input.electronicSignatureAccepted,
  };
}

export async function getCertificationQuestionnaire(applicationId: bigint, owner?: Owner) {
  const application = await prisma.certificationApplication.findFirst({ where: { id: applicationId, deletedAt: null, ...(owner ? { businessId: owner.businessId } : { status: { not: CertificationApplicationStatus.DRAFT } }) }, select: { businessId: true, type: true, applicantSnapshot: true, productInformation: true, manufacturingInformation: true, certificationQuestionnaire: true } });
  if (!application) throw new Error("NOT_FOUND");
  if (!application.certificationQuestionnaire) {
    const [latest, profile] = await Promise.all([
      prisma.certificationQuestionnaire.findFirst({ where: { application: { businessId: application.businessId, id: { not: applicationId }, deletedAt: null }, deletedAt: null }, orderBy: { updatedAt: "desc" }, select: { businessLegality: true } }),
      prisma.businessProfile.findUnique({ where: { businessId: application.businessId }, select: { taxNumber: true, siupNumber: true } }),
    ]);
    const profileFallback = { npwp: { number: profile?.taxNumber ?? "" }, industrialLicense: { number: profile?.siupNumber ?? "" } };
    return { type: application.type, applicantInformation: application.applicantSnapshot, productInformation: application.productInformation ?? {}, productionInformation: application.manufacturingInformation ?? {}, businessLegality: latest?.businessLegality ?? profileFallback };
  }
  const item = application.certificationQuestionnaire;
  return { ...item, id: item.id.toString(), applicationId: item.applicationId.toString(), approvalDate: item.approvalDate?.toISOString().slice(0, 10) ?? "", submittedAt: item.submittedAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() };
}

export async function saveCertificationQuestionnaire(owner: Owner, applicationId: bigint, input: CertificationQuestionnaireInput, context: RequestContext, submit: boolean) {
  if (submit) {
    const parsed = certificationQuestionnaireSubmissionSchema.safeParse(input);
    if (!parsed.success) throw new Error("QUESTIONNAIRE_INCOMPLETE");
  }
  await prisma.$transaction(async (transaction) => {
    const application = await transaction.certificationApplication.findFirst({ where: { id: applicationId, businessId: owner.businessId, status: { in: ["DRAFT", "REVISION_REQUIRED"] }, deletedAt: null }, select: { id: true, status: true, type: true, contactPerson: true, certificateRecipient: true, productInformation: true, manufacturingInformation: true, requirementsAccepted: true, licenseAgreementAccepted: true, certificationQuestionnaire: { select: { businessLegality: true } }, documents: { where: { deletedAt: null }, select: { documentType: true } } } });
    if (!application) throw new Error("INVALID_STATUS");
    if (submit) {
      const complete = certificationSubmissionSchema.safeParse({ type: application.type, contactPerson: application.contactPerson, recipientSameAsApplicant: application.certificateRecipient === null, certificateRecipient: application.certificateRecipient ?? undefined, productInformation: application.productInformation, manufacturingInformation: application.manufacturingInformation, requirementsAccepted: application.requirementsAccepted, licenseAgreementAccepted: application.licenseAgreementAccepted });
      if (!complete.success) throw new Error("APPLICATION_INCOMPLETE");
      const requiredDocuments = ["APPLICANT_IDENTITY", "APPLICANT_TAX_ID", "BUSINESS_LEGALITY", "QUALITY_GUIDE", "BUSINESS_CERTIFICATES", "SNI_MARK_ILLUSTRATION"];
      if (requiredDocuments.some((type) => !application.documents.some((document) => document.documentType === type))) throw new Error("DOCUMENT_REQUIRED");
      const documentIds = legalityDocumentIds(input);
      const ownedDocuments = await transaction.certificationApplicationDocument.count({ where: { id: { in: documentIds }, documentType: "BUSINESS_LEGALITY", deletedAt: null, application: { businessId: owner.businessId, deletedAt: null } } });
      if (ownedDocuments !== documentIds.length) throw new Error("DOCUMENT_REQUIRED");
    }
    await transaction.certificationQuestionnaire.upsert({ where: { applicationId }, create: { applicationId, ...data(input), submittedAt: submit ? new Date() : null }, update: { ...data(input), submittedAt: submit ? new Date() : undefined, deletedAt: null } });
    const legality = input.businessLegality as Record<string, unknown>;
    const npwp = legality.npwp as Record<string, unknown> | undefined;
    const industrialLicense = legality.industrialLicense as Record<string, unknown> | undefined;
    await transaction.businessProfile.updateMany({ where: { businessId: owner.businessId, deletedAt: null }, data: { taxNumber: typeof npwp?.number === "string" && npwp.number.trim() ? npwp.number.trim() : undefined, siupNumber: typeof industrialLicense?.number === "string" && industrialLicense.number.trim() ? industrialLicense.number.trim() : undefined } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: AuditAction.UPDATE, entityType: "BUSINESS_LEGALITY_PROFILE", entityId: owner.businessId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, previousValue: application.certificationQuestionnaire?.businessLegality ?? Prisma.JsonNull, newValue: toJson(input.businessLegality), metadata: { source: "CERTIFICATION_APPLICATION", applicationId: applicationId.toString(), snapshotCreated: submit } } });
    if (submit) {
      const status = application.status === "DRAFT" ? CertificationApplicationStatus.SUBMITTED : CertificationApplicationStatus.RESUBMITTED;
      await transaction.certificationApplication.update({ where: { id: applicationId }, data: { status, submittedAt: new Date(), reviewNotes: null } });
      await transaction.certificationApplicationHistory.create({ data: { applicationId, status, actorUserId: BigInt(owner.userId), notes: "Permohonan dan kuesioner DK 7.3 diajukan." } });
    }
    await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: submit ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE, entityType: "CERTIFICATION_QUESTIONNAIRE", entityId: applicationId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: submit ? { status: "SUBMITTED" } : Prisma.JsonNull } });
  });
}
