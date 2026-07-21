import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApplicationDocumentType, AuditAction } from "@/app/generated/prisma/client";
import { resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { sanitizeOriginalFileName, validateDocumentFile } from "@/lib/business-documents/document-validation";

const types = new Set(Object.values(ApplicationDocumentType));
const root = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PRIVATE_UPLOAD_DIR?.trim() || "storage/private");
function target(relative: string) { const result = path.resolve(root(), relative); const difference = path.relative(root(), result); if (difference.startsWith("..") || path.isAbsolute(difference)) throw new Error("INVALID_FILE"); return result; }

export async function uploadApplicationDocument(userId: string, applicationId: string, form: FormData, context: RequestContext) {
  const membership = await resolveCurrentBusiness(userId); if (!membership) throw new Error("BUSINESS_REQUIRED");
  const application = await prisma.testingApplication.findFirst({ where: { id: BigInt(applicationId), status: "DRAFT", deletedAt: null, businessProfile: { businessId: membership.businessId } }, select: { id: true } }); if (!application) throw new Error("NOT_DRAFT");
  const file = form.get("file"); const rawType = form.get("documentType"); const documentName = String(form.get("documentName") ?? "").trim();
  if (!(file instanceof File) || typeof rawType !== "string" || !types.has(rawType as ApplicationDocumentType)) throw new Error("INVALID_FILE");
  if (rawType === "LAINNYA" && !documentName) throw new Error("INVALID_FILE");
  const bytes = new Uint8Array(await file.arrayBuffer()); const checked = validateDocumentFile(file, bytes); const fileName = sanitizeOriginalFileName(file.name); const stored = `${randomUUID()}${checked.extension}`; const relative = path.join("testing-applications", applicationId, stored).replaceAll("\\", "/"); const absolute = target(relative); await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, bytes, { flag: "wx" });
  try { const document = await prisma.$transaction(async (transaction) => { const created = await transaction.applicationDocument.create({ data: { testingApplicationId: application.id, documentType: rawType as ApplicationDocumentType, documentName: documentName || null, fileName, filePath: relative, mimeType: checked.mimeType, fileSize: bytes.length } }); await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.CREATE, entityType: "APPLICATION_DOCUMENT", entityId: created.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } }); return created; }); return { ...document, id: document.id.toString(), testingApplicationId: document.testingApplicationId.toString(), fileSize: document.fileSize.toString() }; } catch (error) { await unlink(absolute).catch(() => undefined); throw error; }
}

export async function deleteApplicationDocument(userId: string, applicationId: string, documentId: string, context: RequestContext): Promise<void> {
  const membership = await resolveCurrentBusiness(userId); if (!membership) throw new Error("BUSINESS_REQUIRED");
  const document = await prisma.applicationDocument.findFirst({ where: { id: BigInt(documentId), testingApplicationId: BigInt(applicationId), deletedAt: null, application: { status: "DRAFT", deletedAt: null, businessProfile: { businessId: membership.businessId } } } }); if (!document) throw new Error("NOT_DRAFT");
  await prisma.$transaction(async (transaction) => { await transaction.applicationDocument.update({ where: { id: document.id }, data: { deletedAt: new Date() } }); await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.DELETE, entityType: "APPLICATION_DOCUMENT", entityId: document.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } }); }); await unlink(target(document.filePath)).catch(() => undefined);
}
