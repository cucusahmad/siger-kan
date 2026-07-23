import { AuditAction, Prisma, TestingApplicationStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import type { DraftApplicationInput, ReceptionReviewInput, SubmitApplicationInput, UptdApprovalInput } from "./testing-application.schema";

interface Owner { readonly userId: string; readonly businessId: bigint }

async function businessProfileId(owner: Owner, transaction: Prisma.TransactionClient): Promise<bigint> {
  const profile = await transaction.businessProfile.findFirst({ where: { businessId: owner.businessId, deletedAt: null }, select: { id: true } });
  if (!profile) throw new Error("BUSINESS_REQUIRED");
  return profile.id;
}

const detailInclude = { laboratory: { select: { id: true, code: true, name: true, address: true } }, businessProfile: { select: { id: true, businessType: true, tradeName: true, nib: true, picName: true, picPosition: true, email: true, phone: true, whatsapp: true, addressLine: true, postalCode: true, business: { select: { name: true, businessCode: true } }, province: { select: { name: true } }, regency: { select: { name: true } }, district: { select: { name: true } }, village: { select: { name: true } } } }, product: true, samples: { where: { deletedAt: null }, orderBy: { id: "asc" as const } }, parameters: { include: { parameter: { include: { category: true } }, sample: { select: { id: true, sampleName: true } } } }, documents: { where: { deletedAt: null }, orderBy: { uploadedAt: "desc" as const } }, sampleShipment: { include: { evidence: { select: { id: true, fileName: true, mimeType: true, fileSize: true } } } }, sampleReview: true } as const;

function serialize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item instanceof Prisma.Decimal ? item.toString() : item));
}

export async function listApplications(owner: Owner, query: { search: string; status?: TestingApplicationStatus; from?: string; to?: string; page: number; pageSize: number }) {
  const profileId = await businessProfileId(owner, prisma);
  const where: Prisma.TestingApplicationWhereInput = { businessProfileId: profileId, deletedAt: null, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ applicationNumber: { contains: query.search, mode: "insensitive" } }, { product: { productName: { contains: query.search, mode: "insensitive" } } }] } : {}), ...((query.from || query.to) ? { createdAt: { ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}) } } : {}) };
  const [items, total, grouped] = await Promise.all([
    prisma.testingApplication.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: { id: true, applicationNumber: true, createdAt: true, purpose: true, otherPurpose: true, status: true, product: { select: { productName: true } }, _count: { select: { samples: { where: { deletedAt: null } } } } } }),
    prisma.testingApplication.count({ where }),
    prisma.testingApplication.groupBy({ by: ["status"], where: { businessProfileId: profileId, deletedAt: null }, _count: true }),
  ]);
  const stats = Object.fromEntries(grouped.map((item) => [item.status, item._count]));
  return serialize({ items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) }, stats: { total: grouped.reduce((sum, item) => sum + item._count, 0), ...stats } });
}

export async function getApplication(owner: Owner, id: string) {
  const profileId = await businessProfileId(owner, prisma);
  const application = await prisma.testingApplication.findFirst({ where: { id: BigInt(id), businessProfileId: profileId, deletedAt: null }, include: { ...detailInclude, laboratoryReport: { select: { id: true, reportNumber: true, status: true, reportDate: true, finalFileName: true, finalUploadedAt: true, publishedAt: true } } } });
  if (!application) throw new Error("NOT_FOUND");
  return serialize(application);
}

async function persistRelations(transaction: Prisma.TransactionClient, applicationId: bigint, input: DraftApplicationInput): Promise<void> {
  if (input.laboratoryId && await transaction.laboratory.count({ where: { id: BigInt(input.laboratoryId), isActive: true, deletedAt: null } }) !== 1) throw new Error("INVALID_MASTER");
  await transaction.testingApplicationProduct.deleteMany({ where: { testingApplicationId: applicationId } });
  if (input.product) await transaction.testingApplicationProduct.create({ data: { testingApplicationId: applicationId, productName: input.product.productName || null, productType: input.product.productType || null, hsCode: input.product.hsCode || null, productForm: input.product.productForm || null, otherProductForm: input.product.otherProductForm || null, description: input.product.description || null } });
  await transaction.applicationTestingParameter.deleteMany({ where: { testingApplicationId: applicationId } });
  await transaction.testingSample.deleteMany({ where: { testingApplicationId: applicationId } });
  const samples = [];
  for (const sample of input.samples) samples.push(await transaction.testingSample.create({ data: { testingApplicationId: applicationId, sampleName: sample.sampleName || null, quantity: sample.quantity ?? null, weight: sample.weight ?? null, weightUnit: sample.weightUnit || null, packaging: sample.packaging || null, condition: sample.condition || null, samplingDate: sample.samplingDate ? new Date(`${sample.samplingDate}T00:00:00.000Z`) : null, samplingLocation: sample.samplingLocation || null, temperature: sample.temperature ?? null, description: sample.description || null } }));
  const parameterIds = [...new Set(input.parameters.map((item) => BigInt(item.parameterId)))];
  if (parameterIds.length && await transaction.testingParameter.count({ where: { id: { in: parameterIds }, isActive: true, deletedAt: null } }) !== parameterIds.length) throw new Error("INVALID_MASTER");
  for (const mapping of input.parameters) {
    const sample = mapping.sampleIndex !== undefined ? samples[mapping.sampleIndex] : samples.find((item) => item.id.toString() === mapping.sampleId);
    if (!sample) throw new Error("INVALID_MASTER");
    await transaction.applicationTestingParameter.create({ data: { testingApplicationId: applicationId, testingSampleId: sample.id, testingParameterId: BigInt(mapping.parameterId) } });
  }
}

export async function saveDraft(owner: Owner, input: DraftApplicationInput, context: RequestContext, id?: string) {
  return prisma.$transaction(async (transaction) => {
    const profileId = await businessProfileId(owner, transaction);
    let application;
    if (id) {
      application = await transaction.testingApplication.findFirst({ where: { id: BigInt(id), businessProfileId: profileId, deletedAt: null } });
      if (!application) throw new Error("NOT_FOUND");
      if (application.status !== "DRAFT" && application.status !== "PERLU_PERBAIKAN") throw new Error("NOT_DRAFT");
      application = await transaction.testingApplication.update({ where: { id: application.id }, data: { laboratoryId: input.laboratoryId ? BigInt(input.laboratoryId) : null, purpose: input.purpose || null, otherPurpose: input.otherPurpose || null, testingTypes: input.testingTypes, notes: input.notes || null, declarationAccepted: input.declarationAccepted } });
    } else application = await transaction.testingApplication.create({ data: { businessProfileId: profileId, laboratoryId: input.laboratoryId ? BigInt(input.laboratoryId) : null, purpose: input.purpose || null, otherPurpose: input.otherPurpose || null, testingTypes: input.testingTypes, notes: input.notes || null, declarationAccepted: input.declarationAccepted } });
    await persistRelations(transaction, application.id, input);
    await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: id ? AuditAction.UPDATE : AuditAction.CREATE, entityType: "TESTING_APPLICATION", entityId: application.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return serialize(await transaction.testingApplication.findUniqueOrThrow({ where: { id: application.id }, include: detailInclude }));
  });
}

export async function deleteApplication(owner: Owner, id: string, context: RequestContext): Promise<void> {
  await prisma.$transaction(async (transaction) => { const profileId = await businessProfileId(owner, transaction); const item = await transaction.testingApplication.findFirst({ where: { id: BigInt(id), businessProfileId: profileId, deletedAt: null } }); if (!item) throw new Error("NOT_FOUND"); if (item.status !== "DRAFT") throw new Error("NOT_DRAFT"); await transaction.testingApplication.update({ where: { id: item.id }, data: { deletedAt: new Date() } }); await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: AuditAction.DELETE, entityType: "TESTING_APPLICATION", entityId: item.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } }); });
}

export async function submitApplication(owner: Owner, id: string, input: SubmitApplicationInput, context: RequestContext) {
  await saveDraft(owner, input, context, id);
  return prisma.$transaction(async (transaction) => { const profileId = await businessProfileId(owner, transaction); const item = await transaction.testingApplication.findFirst({ where: { id: BigInt(id), businessProfileId: profileId, status: { in: ["DRAFT", "PERLU_PERBAIKAN"] }, deletedAt: null } }); if (!item) throw new Error("NOT_DRAFT"); let applicationNumber = item.applicationNumber; if (!applicationNumber) { const year = new Date().getFullYear(); const counter = await transaction.testingApplicationCounter.upsert({ where: { year }, create: { year, lastNumber: 1 }, update: { lastNumber: { increment: 1 } } }); applicationNumber = `PMHP-${year}-${String(counter.lastNumber).padStart(6, "0")}`; } const application = await transaction.testingApplication.update({ where: { id: item.id }, data: { applicationNumber, status: "DIAJUKAN", submittedAt: new Date(), declarationAccepted: true, receptionChecklist: Prisma.DbNull, correctionNotes: null, reviewedById: null, reviewedAt: null }, include: detailInclude }); await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: AuditAction.STATUS_CHANGE, entityType: "TESTING_APPLICATION", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status: "DIAJUKAN", applicationNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent } }); return serialize(application); });
}

export async function listReceptionApplications(query: { readonly search?: string; readonly status?: TestingApplicationStatus }) {
  const where: Prisma.TestingApplicationWhereInput = { deletedAt: null, status: query.status ? query.status : { in: ["DIAJUKAN", "PERLU_PERBAIKAN", "MENUNGGU_PERSETUJUAN_UPTD", "MENUNGGU_SAMPEL", "SAMPEL_DIKIRIM", "KAJI_ULANG"] }, ...(query.search ? { OR: [{ applicationNumber: { contains: query.search, mode: "insensitive" } }, { businessProfile: { business: { name: { contains: query.search, mode: "insensitive" } } } }, { product: { productName: { contains: query.search, mode: "insensitive" } } }] } : {}) };
  return serialize(await prisma.testingApplication.findMany({ where, orderBy: [{ submittedAt: "asc" }, { id: "asc" }], select: { id: true, applicationNumber: true, status: true, submittedAt: true, updatedAt: true, correctionNotes: true, businessProfile: { select: { business: { select: { name: true } } } }, laboratory: { select: { name: true } }, product: { select: { productName: true } }, _count: { select: { samples: { where: { deletedAt: null } }, documents: { where: { deletedAt: null } } } } } }));
}

export async function getReceptionApplication(id: string) {
  const application = await prisma.testingApplication.findFirst({ where: { id: BigInt(id), deletedAt: null }, include: { ...detailInclude, reviewedBy: { select: { profile: { select: { fullName: true } } } } } });
  if (!application) throw new Error("NOT_FOUND");
  return serialize(application);
}

export async function reviewReceptionApplication(userId: string, id: string, input: ReceptionReviewInput, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.testingApplication.findFirst({ where: { id: BigInt(id), status: "DIAJUKAN", deletedAt: null }, select: { id: true, status: true, businessProfile: { select: { businessId: true } } } });
    if (!item) throw new Error("INVALID_STATUS");
    const status = input.decision === "APPROVE" ? TestingApplicationStatus.MENUNGGU_PERSETUJUAN_UPTD : TestingApplicationStatus.PERLU_PERBAIKAN;
    const application = await transaction.testingApplication.update({ where: { id: item.id }, data: { status, receptionChecklist: input.checklist, correctionNotes: input.notes || null, reviewedById: BigInt(userId), reviewedAt: new Date() }, include: detailInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: item.businessProfile.businessId, action: input.decision === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT, entityType: "TESTING_APPLICATION_RECEPTION", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status, checklist: input.checklist, notes: input.notes }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return serialize(application);
  });
}

export async function listUptdApprovalApplications() {
  return serialize(await prisma.testingApplication.findMany({
    where: { status: "MENUNGGU_PERSETUJUAN_UPTD", deletedAt: null },
    orderBy: [{ reviewedAt: "asc" }, { id: "asc" }],
    select: { id: true, applicationNumber: true, reviewedAt: true, businessProfile: { select: { business: { select: { name: true } } } }, laboratory: { select: { name: true } }, product: { select: { productName: true } } },
  }));
}

export async function decideUptdApproval(userId: string, id: string, input: UptdApprovalInput, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.testingApplication.findFirst({ where: { id: BigInt(id), status: "MENUNGGU_PERSETUJUAN_UPTD", deletedAt: null }, select: { id: true, status: true, applicationNumber: true, businessProfile: { select: { businessId: true } } } });
    if (!item) throw new Error("INVALID_STATUS");
    const status = input.decision === "APPROVE" ? TestingApplicationStatus.MENUNGGU_SAMPEL : TestingApplicationStatus.DITOLAK;
    const application = await transaction.testingApplication.update({ where: { id: item.id }, data: { status, approvedById: BigInt(userId), approvedAt: new Date(), approvalNotes: input.notes || null }, include: detailInclude });
    const recipients = await transaction.businessMember.findMany({ where: { businessId: item.businessProfile.businessId, status: "ACTIVE", deletedAt: null }, select: { userId: true } });
    await transaction.notification.createMany({ data: recipients.map(({ userId }) => ({ userId, title: input.decision === "APPROVE" ? "Permohonan disetujui Kepala UPTD" : "Permohonan ditolak Kepala UPTD", message: input.decision === "APPROVE" ? `Permohonan ${item.applicationNumber ?? "pengujian"} telah disetujui. Silakan kirim sampel fisik dan isi Berita Pengiriman Sampel.` : `Permohonan ${item.applicationNumber ?? "pengujian"} ditolak. ${input.notes}`, href: `/dashboard/permohonan/${item.id}` })) });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: item.businessProfile.businessId, action: input.decision === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT, entityType: "TESTING_APPLICATION_UPTD_APPROVAL", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status, notes: input.notes }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return serialize(application);
  });
}

export async function getLaboratories() { return serialize(await prisma.laboratory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, code: true, name: true, address: true } })); }
export async function getTestingParameters() { return serialize(await prisma.testingParameter.findMany({ where: { isActive: true, deletedAt: null, category: { isActive: true, deletedAt: null } }, orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }], include: { category: { select: { id: true, code: true, name: true } } } })); }
