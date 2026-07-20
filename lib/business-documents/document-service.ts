import { AuditAction, DocumentVerificationStatus, LegalDocumentType, Prisma } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import {
  businessDocumentFileExists,
  deleteBusinessDocumentFile,
  saveBusinessDocumentFile,
  type SavedBusinessDocumentFile,
} from "./document-storage";
import { getDocumentDisplayName, singleDocumentTypes } from "./document-types";
import { dateOnlyToDate, sanitizeOriginalFileName } from "./document-validation";

export interface ValidatedDocumentInput {
  readonly documentType: LegalDocumentType;
  readonly customTitle: string;
  readonly documentNumber: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly originalFileName: string;
  readonly fileSizeBytes: number;
  readonly buffer: Buffer;
  readonly extension: string;
  readonly mimeType: string;
}

const documentSelect = {
  id: true, businessId: true, type: true, documentName: true, documentNumber: true,
  originalFileName: true, storageKey: true, mimeType: true, fileExtension: true,
  fileSizeBytes: true, checksum: true, verificationStatus: true, rejectionReason: true,
  issuedAt: true, expiresAt: true, createdAt: true, updatedAt: true, deletedAt: true,
} satisfies Prisma.BusinessLegalDocumentSelect;

type SelectedDocument = Prisma.BusinessLegalDocumentGetPayload<{ select: typeof documentSelect }>;

async function resolveEditableBusiness(userId: string) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership || !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

export async function listBusinessDocuments(userId: string, canManage: boolean) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const documents = await prisma.businessLegalDocument.findMany({
    where: { businessId: membership.businessId, deletedAt: null },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: documentSelect,
  });
  return Promise.all(documents.map((document) => serializeDocument(document, canManage, businessDocumentFileExists(document.storageKey))));
}

export async function listBusinessDocumentsByBusinessId(businessId: bigint, canManage: boolean) {
  const documents = await prisma.businessLegalDocument.findMany({
    where: { businessId, deletedAt: null },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: documentSelect,
  });
  return Promise.all(documents.map((document) => serializeDocument(document, canManage, businessDocumentFileExists(document.storageKey))));
}

export async function getOwnedDocument(userId: string, documentId: string): Promise<SelectedDocument> {
  if (!/^\d+$/.test(documentId)) throw new Error("DOCUMENT_NOT_FOUND");
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const document = await prisma.businessLegalDocument.findFirst({
    where: { id: BigInt(documentId), businessId: membership.businessId, deletedAt: null }, select: documentSelect,
  });
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  return document;
}

export async function getAccessibleDocument(userId: string, documentId: string, allowAllBusinesses = false): Promise<SelectedDocument> {
  if (!allowAllBusinesses) return getOwnedDocument(userId, documentId);
  if (!/^\d+$/.test(documentId)) throw new Error("DOCUMENT_NOT_FOUND");
  const document = await prisma.businessLegalDocument.findFirst({
    where: { id: BigInt(documentId), deletedAt: null, business: { deletedAt: null } }, select: documentSelect,
  });
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  return document;
}

export async function createBusinessDocument(userId: string, input: ValidatedDocumentInput, context: RequestContext) {
  const membership = await resolveEditableBusiness(userId);
  if (singleDocumentTypes.has(input.documentType)) {
    const duplicate = await prisma.businessLegalDocument.findFirst({ where: { businessId: membership.businessId, type: input.documentType, deletedAt: null }, select: { id: true } });
    if (duplicate) throw new Error("DUPLICATE_DOCUMENT");
  }
  let savedFile: SavedBusinessDocumentFile | null = null;
  try {
    savedFile = await saveBusinessDocumentFile(membership.businessId, input.buffer, input.extension);
    const persistedFile = savedFile;
    const document = await prisma.$transaction(async (transaction) => {
      const created = await transaction.businessLegalDocument.create({ data: {
        businessId: membership.businessId, type: input.documentType,
        documentName: getDocumentDisplayName(input.documentType, input.customTitle || null),
        documentNumber: input.documentNumber || null, storageKey: persistedFile.relativeStorageKey,
        originalFileName: sanitizeOriginalFileName(input.originalFileName), mimeType: input.mimeType,
        fileExtension: input.extension, fileSizeBytes: BigInt(persistedFile.fileSizeBytes), storageProvider: "LOCAL",
        checksum: persistedFile.checksum, issuedAt: dateOnlyToDate(input.issuedAt), expiresAt: dateOnlyToDate(input.expiresAt),
        uploadedByUserId: BigInt(userId), verificationStatus: DocumentVerificationStatus.PENDING,
      }, select: documentSelect });
      await transaction.auditLog.create({ data: {
        actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.CREATE,
        entityType: "BUSINESS_DOCUMENT", entityId: created.id.toString(), ipAddress: context.ipAddress,
        userAgent: context.userAgent, metadata: auditMetadata("BUSINESS_DOCUMENT_UPLOADED", created),
      } });
      return created;
    });
    console.info("Business document metadata inserted", {
      businessId: membership.businessId.toString(),
      documentId: document.id.toString(),
      storedFileName: persistedFile.storedFileName,
    });
    return serializeDocument(document, true, Promise.resolve(true));
  } catch (error: unknown) {
    if (savedFile) {
      console.info("Cleaning up orphan business document file", {
        businessId: membership.businessId.toString(),
        storedFileName: savedFile.storedFileName,
      });
      await deleteBusinessDocumentFile(savedFile.relativeStorageKey).catch((cleanupError: unknown) => {
        console.error("Business document orphan cleanup failed", { cleanupError });
      });
    }
    throw error;
  }
}

export async function replaceBusinessDocument(userId: string, documentId: string, input: ValidatedDocumentInput, context: RequestContext, allowAllBusinesses = false) {
  const current = await getAccessibleDocument(userId, documentId, allowAllBusinesses);
  const businessId = allowAllBusinesses ? current.businessId : (await resolveEditableBusiness(userId)).businessId;
  const stored = await saveBusinessDocumentFile(businessId, input.buffer, input.extension);
  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const document = await transaction.businessLegalDocument.update({ where: { id: current.id }, data: {
        type: input.documentType, documentName: getDocumentDisplayName(input.documentType, input.customTitle || null),
        documentNumber: input.documentNumber || null, storageKey: stored.relativeStorageKey,
        originalFileName: sanitizeOriginalFileName(input.originalFileName), mimeType: input.mimeType,
        fileExtension: input.extension, fileSizeBytes: BigInt(stored.fileSizeBytes), checksum: stored.checksum,
        issuedAt: dateOnlyToDate(input.issuedAt), expiresAt: dateOnlyToDate(input.expiresAt), uploadedByUserId: BigInt(userId),
        verificationStatus: DocumentVerificationStatus.PENDING, verifiedById: null, verifiedAt: null, rejectionReason: null,
      }, select: documentSelect });
      await transaction.auditLog.create({ data: {
        actorUserId: BigInt(userId), businessId, action: AuditAction.UPDATE,
        entityType: "BUSINESS_DOCUMENT", entityId: document.id.toString(), ipAddress: context.ipAddress,
        userAgent: context.userAgent, metadata: auditMetadata("BUSINESS_DOCUMENT_REPLACED", document),
      } });
      return document;
    });
    console.info("Business document replacement metadata inserted", {
      businessId: businessId.toString(),
      documentId: updated.id.toString(),
      storedFileName: stored.storedFileName,
    });
    await deleteBusinessDocumentFile(current.storageKey).catch((error: unknown) => console.error("Replaced business document cleanup failed", { documentId, error }));
    return serializeDocument(updated, true, Promise.resolve(true));
  } catch (error: unknown) {
    await deleteBusinessDocumentFile(stored.relativeStorageKey).catch((cleanupError: unknown) => console.error("Business document replacement cleanup failed", { cleanupError }));
    throw error;
  }
}

export async function deleteBusinessDocument(userId: string, documentId: string, context: RequestContext, allowAllBusinesses = false): Promise<void> {
  const current = await getAccessibleDocument(userId, documentId, allowAllBusinesses);
  const businessId = allowAllBusinesses ? current.businessId : (await resolveEditableBusiness(userId)).businessId;
  await prisma.$transaction(async (transaction) => {
    await transaction.businessLegalDocument.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(userId), businessId, action: AuditAction.DELETE,
      entityType: "BUSINESS_DOCUMENT", entityId: current.id.toString(), ipAddress: context.ipAddress,
      userAgent: context.userAgent, metadata: auditMetadata("BUSINESS_DOCUMENT_DELETED", current),
    } });
  });
  await deleteBusinessDocumentFile(current.storageKey).catch((error: unknown) => console.error("Deleted business document file cleanup failed", { documentId, error }));
}

async function serializeDocument(document: SelectedDocument, canManage: boolean, availability: Promise<boolean>) {
  const fileAvailable = await availability;
  if (!fileAvailable) console.error("Business document integrity check failed", { documentId: document.id.toString() });
  return {
    id: document.id.toString(), documentType: document.type,
    documentTypeLabel: getDocumentDisplayName(document.type, null),
    customTitle: document.type === LegalDocumentType.OTHER ? document.documentName : null,
    documentNumber: document.documentNumber, originalFileName: document.originalFileName,
    mimeType: document.mimeType, fileSizeBytes: document.fileSizeBytes.toString(),
    issuedAt: document.issuedAt?.toISOString().slice(0, 10) ?? null,
    expiresAt: document.expiresAt?.toISOString().slice(0, 10) ?? null,
    verificationStatus: document.verificationStatus, verificationNotes: document.rejectionReason,
    createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString(),
    canReplace: canManage, canDelete: canManage, fileAvailable,
  };
}

function auditMetadata(event: string, document: SelectedDocument) {
  return { event, documentId: document.id.toString(), documentType: document.type, businessId: document.businessId.toString(), originalFileName: document.originalFileName, fileSizeBytes: document.fileSizeBytes.toString() };
}
