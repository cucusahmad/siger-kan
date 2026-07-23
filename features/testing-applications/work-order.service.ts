import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AuditAction, Prisma, TestingWorkOrderDocumentType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { assignWorkOrderSchema, analystSubmissionSchema, supervisorVerificationSchema } from "./work-order.schema";

const allowedTypes = new Set(Object.values(TestingWorkOrderDocumentType));
const allowedFiles = new Map([["application/pdf", ".pdf"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"], ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"], ["image/jpeg", ".jpg"], ["image/png", ".png"]]);
const uploadRoot = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PRIVATE_UPLOAD_DIR?.trim() || "storage/private");
function serialize(value: unknown): unknown { return JSON.parse(JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item)); }
function safeTarget(relative: string): string { const result = path.resolve(uploadRoot(), relative); const difference = path.relative(uploadRoot(), result); if (difference.startsWith("..") || path.isAbsolute(difference)) throw new Error("INVALID_FILE"); return result; }

const workOrderSelect = { id: true, workOrderNumber: true, type: true, status: true, priority: true, targetCompletionDate: true, testingMethod: true, laboratoryEquipment: true, laboratoryRoom: true, workInstructions: true, analystNotes: true, application: { select: { applicationNumber: true, businessProfile: { select: { business: { select: { name: true } } } } } }, applicationParameter: { select: { parameter: { select: { name: true, code: true, method: true } }, sample: { select: { sampleName: true } } } }, analyst: { select: { id: true, profile: { select: { fullName: true } } } }, documents: { where: { deletedAt: null }, select: { id: true, type: true, fileName: true, mimeType: true, fileSize: true, uploadedAt: true } } } as const;

export async function listWorkOrders(userId: string, role: "SUPERVISOR" | "ANALYST" | "SUBCONTRACT") { const where: Prisma.TestingWorkOrderWhereInput = { deletedAt: null, ...(role === "SUPERVISOR" ? { type: "INTERNAL" } : role === "ANALYST" ? { type: "INTERNAL", analystId: BigInt(userId) } : { type: "SUBCONTRACT" }) }; return serialize(await prisma.testingWorkOrder.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], select: workOrderSelect })); }
export async function getWorkOrder(id: string) { const item = await prisma.testingWorkOrder.findFirst({ where: { id: BigInt(id), deletedAt: null }, select: workOrderSelect }); if (!item) throw new Error("NOT_FOUND"); return serialize(item); }
export async function listAnalysts() { return serialize(await prisma.user.findMany({ where: { status: "ACTIVE", deletedAt: null, roles: { some: { revokedAt: null, role: { code: "ANALIS_LAB", isActive: true, deletedAt: null } } } }, orderBy: { profile: { fullName: "asc" } }, select: { id: true, profile: { select: { fullName: true, employeeNumber: true } } } })); }

export async function listPendingResultVerifications() {
  return serialize(await prisma.testingWorkOrder.findMany({
    where: { type: "INTERNAL", status: "MENUNGGU_VERIFIKASI_PENYELIA", deletedAt: null },
    orderBy: { sentToSupervisorAt: "asc" },
    select: workOrderSelect,
  }));
}

export async function verifyWorkOrderResult(userId: string, id: string, payload: unknown, context: RequestContext) {
  const parsed = supervisorVerificationSchema.safeParse(payload);
  if (!parsed.success) throw new Error("INVALID_VERIFICATION");
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.testingWorkOrder.findFirst({
      where: { id: BigInt(id), type: "INTERNAL", status: "MENUNGGU_VERIFIKASI_PENYELIA", deletedAt: null },
      select: { id: true, testingApplicationId: true, analystId: true, status: true },
    });
    if (!item) throw new Error("INVALID_STATUS");
    const approved = parsed.data.decision === "SETUJUI";
    const nextStatus = approved ? "HASIL_TERVERIFIKASI" : "DALAM_PENGUJIAN";
    await transaction.testingWorkOrder.update({
      where: { id: item.id },
      data: { status: nextStatus, reviewedById: BigInt(userId), reviewedAt: new Date(), supervisorNotes: parsed.data.notes || null },
    });
    if (approved) {
      const unfinished = await transaction.testingWorkOrder.count({
        where: { testingApplicationId: item.testingApplicationId, deletedAt: null, id: { not: item.id }, status: { not: "HASIL_TERVERIFIKASI" } },
      });
      if (unfinished === 0) await transaction.testingApplication.update({ where: { id: item.testingApplicationId }, data: { status: "SELESAI" } });
    }
    if (!approved && item.analystId) {
      await transaction.notification.create({ data: { userId: item.analystId, title: "Hasil pengujian perlu diperbaiki", message: parsed.data.notes, href: `/dashboard/quality-testing/work-orders/${id}` } });
    }
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: approved ? AuditAction.APPROVE : AuditAction.REJECT, entityType: "TESTING_WORK_ORDER", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status: nextStatus, notes: parsed.data.notes }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return { status: nextStatus };
  });
}

export async function assignWorkOrder(userId: string, id: string, payload: unknown, context: RequestContext) { const parsed = assignWorkOrderSchema.safeParse(payload); if (!parsed.success) throw new Error("INVALID_WORK_ORDER"); return prisma.$transaction(async (transaction) => { const item = await transaction.testingWorkOrder.findFirst({ where: { id: BigInt(id), type: "INTERNAL", status: "MENUNGGU_PENUGASAN_ANALIS", deletedAt: null } }); if (!item) throw new Error("INVALID_STATUS"); const analystExists = await transaction.user.count({ where: { id: BigInt(parsed.data.analystId), status: "ACTIVE", deletedAt: null, roles: { some: { revokedAt: null, role: { code: "ANALIS_LAB" } } } } }); if (!analystExists) throw new Error("INVALID_WORK_ORDER"); const updated = await transaction.testingWorkOrder.update({ where: { id: item.id }, data: { analystId: BigInt(parsed.data.analystId), assignedById: BigInt(userId), assignedAt: new Date(), targetCompletionDate: new Date(`${parsed.data.targetCompletionDate}T00:00:00.000Z`), testingMethod: parsed.data.testingMethod, laboratoryEquipment: parsed.data.laboratoryEquipment, laboratoryRoom: parsed.data.laboratoryRoom, workInstructions: parsed.data.workInstructions, priority: parsed.data.priority, status: "DALAM_PENGUJIAN" }, select: workOrderSelect }); await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: AuditAction.STATUS_CHANGE, entityType: "TESTING_WORK_ORDER", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status: "DALAM_PENGUJIAN", analystId: parsed.data.analystId }, ipAddress: context.ipAddress, userAgent: context.userAgent } }); return serialize(updated); }); }

export async function uploadWorkOrderDocument(userId: string, id: string, form: FormData, context: RequestContext) { const item = await prisma.testingWorkOrder.findFirst({ where: { id: BigInt(id), analystId: BigInt(userId), type: "INTERNAL", status: "DALAM_PENGUJIAN", deletedAt: null }, select: { id: true } }); if (!item) throw new Error("INVALID_STATUS"); const file = form.get("file"); const rawType = form.get("documentType"); if (!(file instanceof File) || typeof rawType !== "string" || !allowedTypes.has(rawType as TestingWorkOrderDocumentType) || file.size <= 0 || file.size > 20 * 1024 * 1024) throw new Error("INVALID_FILE"); const extension = allowedFiles.get(file.type); if (!extension || path.extname(file.name).toLowerCase() !== extension) throw new Error("INVALID_FILE"); const relative = path.join("testing-work-orders", id, `${randomUUID()}${extension}`).replaceAll("\\", "/"); const absolute = safeTarget(relative); const bytes = new Uint8Array(await file.arrayBuffer()); await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, bytes, { flag: "wx" }); try { const document = await prisma.$transaction(async (transaction) => { const created = await transaction.testingWorkOrderDocument.create({ data: { testingWorkOrderId: item.id, type: rawType as TestingWorkOrderDocumentType, fileName: path.basename(file.name).slice(0, 255), filePath: relative, mimeType: file.type, fileSize: file.size, uploadedById: BigInt(userId) } }); await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: AuditAction.CREATE, entityType: "TESTING_WORK_ORDER_DOCUMENT", entityId: created.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } }); return created; }); return serialize(document); } catch (error) { await unlink(absolute).catch(() => undefined); throw error; } }

export async function deleteWorkOrderDocument(userId: string, workOrderId: string, documentId: string, context: RequestContext): Promise<void> {
  const document = await prisma.testingWorkOrderDocument.findFirst({ where: { id: BigInt(documentId), testingWorkOrderId: BigInt(workOrderId), deletedAt: null, workOrder: { analystId: BigInt(userId), type: "INTERNAL", status: "DALAM_PENGUJIAN", deletedAt: null } }, select: { id: true, filePath: true } });
  if (!document) throw new Error("INVALID_STATUS");
  await prisma.$transaction(async (transaction) => {
    await transaction.testingWorkOrderDocument.update({ where: { id: document.id }, data: { deletedAt: new Date() } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: AuditAction.DELETE, entityType: "TESTING_WORK_ORDER_DOCUMENT", entityId: document.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
  await unlink(safeTarget(document.filePath)).catch(() => undefined);
}

export async function readWorkOrderDocument(userId: string, role: "SUPERVISOR" | "ANALYST" | "UPTD_HEAD", workOrderId: string, documentId: string) {
  const document = await prisma.testingWorkOrderDocument.findFirst({
    where: { id: BigInt(documentId), testingWorkOrderId: BigInt(workOrderId), deletedAt: null, workOrder: { type: "INTERNAL", deletedAt: null, ...(role === "ANALYST" ? { analystId: BigInt(userId) } : {}) } },
    select: { fileName: true, filePath: true, mimeType: true },
  });
  if (!document) throw new Error("NOT_FOUND");
  try {
    const absolute = safeTarget(document.filePath);
    const [bytes, fileStat] = await Promise.all([readFile(absolute), stat(absolute)]);
    if (!fileStat.isFile()) throw new Error("FILE_UNAVAILABLE");
    const fileName = path.basename(document.fileName);
    const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(bytes, { headers: { "Content-Type": document.mimeType, "Content-Length": fileStat.size.toString(), "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_FILE") throw error;
    throw new Error("FILE_UNAVAILABLE", { cause: error });
  }
}

export async function submitToSupervisor(userId: string, id: string, payload: unknown, context: RequestContext) { const parsed = analystSubmissionSchema.safeParse(payload); if (!parsed.success) throw new Error("INVALID_WORK_ORDER"); return prisma.$transaction(async (transaction) => { const item = await transaction.testingWorkOrder.findFirst({ where: { id: BigInt(id), analystId: BigInt(userId), status: "DALAM_PENGUJIAN", deletedAt: null }, include: { documents: { where: { deletedAt: null }, select: { id: true } } } }); if (!item) throw new Error("INVALID_STATUS"); if (!item.documents.length) throw new Error("DOCUMENT_REQUIRED"); await transaction.testingWorkOrder.update({ where: { id: item.id }, data: { analystNotes: parsed.data.analystNotes || null, status: "MENUNGGU_VERIFIKASI_PENYELIA", sentToSupervisorAt: new Date() } }); await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: AuditAction.STATUS_CHANGE, entityType: "TESTING_WORK_ORDER", entityId: item.id.toString(), previousValue: { status: item.status }, newValue: { status: "MENUNGGU_VERIFIKASI_PENYELIA" }, ipAddress: context.ipAddress, userAgent: context.userAgent } }); }); }
