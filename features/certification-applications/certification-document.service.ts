import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CertificationApplicationStatus, CertificationDocumentType } from "@/app/generated/prisma/client";
import { deleteBusinessDocumentFile, getPrivateUploadRoot, readBusinessDocumentFile } from "@/lib/business-documents/document-storage";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Map([["application/pdf", ".pdf"], ["image/jpeg", ".jpg"], ["image/png", ".png"]]);

export async function uploadCertificationDocument(owner: { readonly userId: string; readonly businessId: bigint }, applicationId: bigint, formData: FormData) {
  const file = formData.get("file"); const type = formData.get("documentType"); const name = formData.get("documentName");
  if (!(file instanceof File) || file.size <= 0 || file.size > 10 * 1024 * 1024 || typeof type !== "string" || !(type in CertificationDocumentType)) throw new Error("INVALID_FILE");
  const allowedStatuses: CertificationApplicationStatus[] = type === "PAYMENT_PROOF" ? [CertificationApplicationStatus.INVOICED] : type === "CORRECTIVE_ACTION_PROOF" ? [CertificationApplicationStatus.CORRECTIVE_ACTION_REQUIRED] : [CertificationApplicationStatus.DRAFT, CertificationApplicationStatus.REVISION_REQUIRED];
  const application = await prisma.certificationApplication.findFirst({ where: { id: applicationId, businessId: owner.businessId, status: { in: allowedStatuses }, deletedAt: null }, select: { id: true } });
  if (!application) throw new Error("INVALID_STATUS");
  const extension = allowedTypes.get(file.type); if (!extension) throw new Error("INVALID_FILE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = file.type === "application/pdf" ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-" : file.type === "image/png" ? bytes[0] === 137 && bytes[1] === 80 : bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!valid) throw new Error("INVALID_FILE");
  const storageKey = path.join("certification-documents", applicationId.toString(), `${randomUUID()}${extension}`).replaceAll("\\", "/");
  const root = getPrivateUploadRoot(); const target = path.resolve(root, storageKey); const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("INVALID_FILE");
  await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: "wx" });
  const document = await prisma.certificationApplicationDocument.create({ data: { applicationId, documentType: CertificationDocumentType[type as keyof typeof CertificationDocumentType], documentName: typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : file.name.slice(0, 200), originalFileName: path.basename(file.name).slice(0, 255), storageKey, mimeType: file.type, fileSize: file.size, uploadedById: BigInt(owner.userId) } });
  return { id: document.id.toString(), documentType: document.documentType, documentName: document.documentName, originalFileName: document.originalFileName, mimeType: document.mimeType, fileSize: document.fileSize.toString(), createdAt: document.createdAt.toISOString() };
}

export async function readCertificationDocument(applicationId: bigint, documentId: bigint, businessId?: bigint) {
  const document = await prisma.certificationApplicationDocument.findFirst({
    where: { id: documentId, applicationId, deletedAt: null, application: { deletedAt: null, ...(businessId ? { businessId } : {}) } },
    select: { storageKey: true, originalFileName: true, mimeType: true },
  });
  if (!document) throw new Error("NOT_FOUND");
  const file = await readBusinessDocumentFile(document.storageKey).catch(() => { throw new Error("FILE_UNAVAILABLE"); });
  return { ...document, ...file };
}

export async function deleteCertificationDocument(owner: { readonly userId: string; readonly businessId: bigint }, applicationId: bigint, documentId: bigint) {
  const document = await prisma.certificationApplicationDocument.findFirst({
    where: { id: documentId, applicationId, deletedAt: null, application: { businessId: owner.businessId, status: { in: ["DRAFT", "REVISION_REQUIRED"] }, deletedAt: null } },
    select: { id: true, storageKey: true },
  });
  if (!document) throw new Error("INVALID_STATUS");
  await prisma.certificationApplicationDocument.update({ where: { id: document.id }, data: { deletedAt: new Date() } });
  await deleteBusinessDocumentFile(document.storageKey);
}
