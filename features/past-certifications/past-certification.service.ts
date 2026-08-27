import { AuditAction } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { pastCertificationSchema, type PastCertificationInput, type PastCertificationView } from "./past-certification.schema";
import { readPastCertificationFile, removePastCertificationFile, savePastCertificationFile } from "./past-certification.storage";

const select = {
  id: true, productName: true, sniNumber: true, spptSniNumber: true, skpNumber: true,
  spptIssuedAt: true, spptExpiresAt: true, certificationStatus: true, notes: true,
  documentName: true, documentSize: true, createdAt: true,
} as const;

async function requireBusiness(userId: string, editable = false) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_REQUIRED");
  if (editable && !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

export async function listPastCertifications(userId: string): Promise<readonly PastCertificationView[]> {
  const membership = await requireBusiness(userId);
  const records = await prisma.pastCertification.findMany({
    where: { businessId: membership.businessId, deletedAt: null }, select,
    orderBy: [{ spptIssuedAt: "desc" }, { createdAt: "desc" }],
  });
  return records.map(serialize);
}

export async function createPastCertification(userId: string, input: PastCertificationInput, file: File | null, context: RequestContext) {
  const parsed = pastCertificationSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_INPUT");
  const membership = await requireBusiness(userId, true);
  const savedFile = file ? await savePastCertificationFile(membership.businessId, file) : null;
  try {
    const record = await prisma.$transaction(async (transaction) => {
      const created = await transaction.pastCertification.create({ data: {
        businessId: membership.businessId,
        productName: parsed.data.productName,
        sniNumber: parsed.data.sniNumber || null,
        spptSniNumber: parsed.data.spptSniNumber || null,
        skpNumber: parsed.data.skpNumber || null,
        spptIssuedAt: toDate(parsed.data.spptIssuedAt),
        spptExpiresAt: toDate(parsed.data.spptExpiresAt),
        certificationStatus: parsed.data.certificationStatus,
        notes: parsed.data.notes || null,
        documentName: savedFile?.name,
        documentStorageKey: savedFile?.storageKey,
        documentMimeType: savedFile?.mimeType,
        documentSize: savedFile?.size,
      }, select });
      await transaction.auditLog.create({ data: {
        actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.CREATE,
        entityType: "PAST_CERTIFICATION", entityId: created.id.toString(), ipAddress: context.ipAddress,
        userAgent: context.userAgent, newValue: { productName: created.productName, certificationStatus: created.certificationStatus },
      } });
      return created;
    });
    return serialize(record);
  } catch (error: unknown) {
    if (savedFile) await removePastCertificationFile(savedFile.storageKey).catch(() => undefined);
    throw error;
  }
}

export async function updatePastCertification(userId: string, certificationId: string, input: PastCertificationInput, file: File | null, context: RequestContext) {
  const id = parseId(certificationId);
  const parsed = pastCertificationSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_INPUT");
  const membership = await requireBusiness(userId, true);
  const current = await prisma.pastCertification.findFirst({
    where: { id, businessId: membership.businessId, deletedAt: null },
    select: { ...select, documentStorageKey: true },
  });
  if (!current) throw new Error("NOT_FOUND");

  const savedFile = file ? await savePastCertificationFile(membership.businessId, file) : null;
  try {
    const record = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.pastCertification.update({
        where: { id: current.id },
        data: {
          productName: parsed.data.productName,
          sniNumber: parsed.data.sniNumber || null,
          spptSniNumber: parsed.data.spptSniNumber || null,
          skpNumber: parsed.data.skpNumber || null,
          spptIssuedAt: toDate(parsed.data.spptIssuedAt),
          spptExpiresAt: toDate(parsed.data.spptExpiresAt),
          certificationStatus: parsed.data.certificationStatus,
          notes: parsed.data.notes || null,
          ...(savedFile ? {
            documentName: savedFile.name,
            documentStorageKey: savedFile.storageKey,
            documentMimeType: savedFile.mimeType,
            documentSize: savedFile.size,
          } : {}),
        },
        select,
      });
      await transaction.auditLog.create({ data: {
        actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.UPDATE,
        entityType: "PAST_CERTIFICATION", entityId: updated.id.toString(), ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        previousValue: { productName: current.productName, certificationStatus: current.certificationStatus },
        newValue: { productName: updated.productName, certificationStatus: updated.certificationStatus },
      } });
      return updated;
    });
    if (savedFile && current.documentStorageKey) {
      await removePastCertificationFile(current.documentStorageKey).catch(() => undefined);
    }
    return serialize(record);
  } catch (error: unknown) {
    if (savedFile) await removePastCertificationFile(savedFile.storageKey).catch(() => undefined);
    throw error;
  }
}

export async function deletePastCertification(userId: string, certificationId: string, context: RequestContext): Promise<void> {
  const id = parseId(certificationId);
  const membership = await requireBusiness(userId, true);
  const current = await prisma.pastCertification.findFirst({
    where: { id, businessId: membership.businessId, deletedAt: null },
    select: { id: true, productName: true, certificationStatus: true, documentStorageKey: true },
  });
  if (!current) throw new Error("NOT_FOUND");
  await prisma.$transaction(async (transaction) => {
    await transaction.pastCertification.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.DELETE,
      entityType: "PAST_CERTIFICATION", entityId: current.id.toString(), ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      previousValue: { productName: current.productName, certificationStatus: current.certificationStatus },
    } });
  });
  if (current.documentStorageKey) await removePastCertificationFile(current.documentStorageKey).catch(() => undefined);
}

export async function getPastCertificationDocument(userId: string, certificationId: string) {
  if (!/^\d+$/.test(certificationId)) throw new Error("NOT_FOUND");
  const membership = await requireBusiness(userId);
  const record = await prisma.pastCertification.findFirst({ where: {
    id: BigInt(certificationId), businessId: membership.businessId, deletedAt: null, documentStorageKey: { not: null },
  }, select: { documentName: true, documentStorageKey: true, documentMimeType: true } });
  if (!record?.documentStorageKey || !record.documentName || !record.documentMimeType) throw new Error("NOT_FOUND");
  const file = await readPastCertificationFile(record.documentStorageKey);
  return { documentName: record.documentName, documentMimeType: record.documentMimeType, ...file };
}

function toDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function parseId(value: string): bigint {
  if (!/^\d+$/.test(value)) throw new Error("NOT_FOUND");
  return BigInt(value);
}

function serialize(record: {
  readonly id: bigint; readonly productName: string; readonly sniNumber: string | null;
  readonly spptSniNumber: string | null; readonly skpNumber: string | null; readonly spptIssuedAt: Date | null;
  readonly spptExpiresAt: Date | null; readonly certificationStatus: string; readonly notes: string | null;
  readonly documentName: string | null; readonly documentSize: bigint | null; readonly createdAt: Date;
}): PastCertificationView {
  return {
    id: record.id.toString(), productName: record.productName, sniNumber: record.sniNumber ?? "",
    spptSniNumber: record.spptSniNumber ?? "", skpNumber: record.skpNumber ?? "",
    spptIssuedAt: record.spptIssuedAt?.toISOString().slice(0, 10) ?? "",
    spptExpiresAt: record.spptExpiresAt?.toISOString().slice(0, 10) ?? "",
    certificationStatus: record.certificationStatus as PastCertificationView["certificationStatus"],
    notes: record.notes ?? "", documentName: record.documentName,
    documentSize: record.documentSize?.toString() ?? null, createdAt: record.createdAt.toISOString(),
  };
}

export function getPastCertificationError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const errors: Readonly<Record<string, { readonly status: number; readonly message: string }>> = {
    BUSINESS_REQUIRED: { status: 403, message: "Akun belum terhubung ke profil usaha." },
    FORBIDDEN: { status: 403, message: "Peran Anda tidak dapat mengelola sertifikasi lampau." },
    INVALID_INPUT: { status: 422, message: "Periksa kembali data sertifikasi." },
    INVALID_FILE: { status: 422, message: "Dokumen wajib berupa PDF, JPG, atau PNG dengan ukuran maksimal 10 MB." },
    NOT_FOUND: { status: 404, message: "Sertifikasi lampau tidak ditemukan." },
    FILE_UNAVAILABLE: { status: 404, message: "Berkas sertifikasi tidak tersedia." },
  };
  return errors[code] ?? { status: 500, message: "Sertifikasi lampau belum dapat diproses. Silakan coba kembali." };
}
