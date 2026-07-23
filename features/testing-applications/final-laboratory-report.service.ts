import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AuditAction } from "@/app/generated/prisma/client";
import { sanitizeOriginalFileName } from "@/lib/business-documents/document-validation";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

const maxFileSize = 5 * 1024 * 1024;
const storageRoot = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PRIVATE_UPLOAD_DIR?.trim() || "storage/private");

function resolveFile(relativePath: string): string {
  const root = storageRoot();
  const target = path.resolve(root, relativePath);
  const difference = path.relative(root, target);
  if (!relativePath || difference.startsWith("..") || path.isAbsolute(difference)) throw new Error("INVALID_FILE");
  return target;
}

function validatePdf(file: File, bytes: Uint8Array): void {
  const signature = [0x25, 0x50, 0x44, 0x46];
  if (!file.size || file.size > maxFileSize || file.type !== "application/pdf" || !signature.every((value, index) => bytes[index] === value)) throw new Error("INVALID_FINAL_REPORT_FILE");
}

export async function publishFinalLaboratoryReport(userId: string, reportId: string, form: FormData, context: RequestContext) {
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("INVALID_FINAL_REPORT_FILE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  validatePdf(file, bytes);
  const fileName = sanitizeOriginalFileName(file.name);
  const relativePath = path.join("laboratory-reports", reportId, `${randomUUID()}.pdf`).replaceAll("\\", "/");
  const absolutePath = resolveFile(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  try {
    return await prisma.$transaction(async (transaction) => {
      const report = await transaction.laboratoryTestReport.findFirst({
        where: { id: BigInt(reportId), status: "MENUNGGU_DOKUMEN_FINAL", deletedAt: null },
        select: { id: true, reportNumber: true, testingApplicationId: true, application: { select: { businessProfile: { select: { businessId: true, business: { select: { members: { where: { status: "ACTIVE", deletedAt: null }, select: { userId: true } } } } } } } } },
      });
      if (!report) throw new Error("INVALID_STATUS");
      const now = new Date();
      const updated = await transaction.laboratoryTestReport.update({ where: { id: report.id }, data: { status: "DITERBITKAN", finalFileName: fileName, finalFilePath: relativePath, finalMimeType: "application/pdf", finalFileSize: BigInt(bytes.length), finalUploadedById: BigInt(userId), finalUploadedAt: now, publishedAt: now }, select: { id: true, status: true, reportNumber: true, finalFileName: true, publishedAt: true } });
      await transaction.testingApplication.update({ where: { id: report.testingApplicationId }, data: { status: "SELESAI" } });
      await transaction.notification.createMany({ data: report.application.businessProfile.business.members.map((member) => ({ userId: member.userId, title: "Laporan Hasil Uji tersedia", message: `LHU ${report.reportNumber} telah diterbitkan dan dapat diunduh.`, href: `/api/laboratory-reports/${report.id}/final-file` })) });
      await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: report.application.businessProfile.businessId, action: AuditAction.STATUS_CHANGE, entityType: "LABORATORY_TEST_REPORT", entityId: report.id.toString(), previousValue: { status: "MENUNGGU_DOKUMEN_FINAL" }, newValue: { status: "DITERBITKAN", fileName }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      return { ...updated, id: updated.id.toString() };
    });
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }
}

export async function downloadFinalLaboratoryReport(userId: string, reportId: string): Promise<Response> {
  const report = await prisma.laboratoryTestReport.findFirst({
    where: { id: BigInt(reportId), status: "DITERBITKAN", deletedAt: null, OR: [{ preparedById: BigInt(userId) }, { approvedById: BigInt(userId) }, { finalUploadedById: BigInt(userId) }, { application: { businessProfile: { business: { members: { some: { userId: BigInt(userId), status: "ACTIVE", deletedAt: null } } } } } }] },
    select: { finalFileName: true, finalFilePath: true, finalMimeType: true },
  });
  if (!report?.finalFilePath || !report.finalFileName) throw new Error("NOT_FOUND");
  try {
    const target = resolveFile(report.finalFilePath);
    const [bytes, fileStat] = await Promise.all([readFile(target), stat(target)]);
    if (!fileStat.isFile()) throw new Error("FILE_UNAVAILABLE");
    const fileName = sanitizeOriginalFileName(report.finalFileName);
    const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(Uint8Array.from(bytes), { headers: { "Content-Type": report.finalMimeType || "application/pdf", "Content-Length": fileStat.size.toString(), "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_FILE") throw error;
    throw new Error("FILE_UNAVAILABLE", { cause: error });
  }
}
