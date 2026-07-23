import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AuditAction } from "@/app/generated/prisma/client";
import { sanitizeOriginalFileName, validateDocumentFile } from "@/lib/business-documents/document-validation";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { sampleShipmentSchema } from "./testing-application.schema";

const uploadRoot = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PRIVATE_UPLOAD_DIR?.trim() || "storage/private");
function resolveTarget(relative: string): string { const target = path.resolve(/* turbopackIgnore: true */ uploadRoot(), relative); const difference = path.relative(uploadRoot(), target); if (difference.startsWith("..") || path.isAbsolute(difference)) throw new Error("INVALID_FILE"); return target; }

export async function createSampleShipment(owner: { readonly userId: string; readonly businessId: bigint }, applicationId: string, form: FormData, context: RequestContext) {
  const parsed = sampleShipmentSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) throw new Error("INVALID_SHIPMENT");
  const files = form.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length < 1 || files.length > 5) throw new Error("INVALID_FILE");
  const application = await prisma.testingApplication.findFirst({ where: { id: BigInt(applicationId), status: "MENUNGGU_SAMPEL", deletedAt: null, sampleShipment: null, businessProfile: { businessId: owner.businessId } }, select: { id: true, applicationNumber: true } });
  if (!application) throw new Error("INVALID_STATUS");
  const saved: { fileName: string; filePath: string; mimeType: string; fileSize: number; absolute: string }[] = [];
  try {
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer()); const checked = validateDocumentFile(file, bytes);
      const relative = path.join("sample-shipments", applicationId, `${randomUUID()}${checked.extension}`).replaceAll("\\", "/"); const absolute = resolveTarget(relative);
      await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, bytes, { flag: "wx" });
      saved.push({ fileName: sanitizeOriginalFileName(file.name), filePath: relative, mimeType: checked.mimeType, fileSize: bytes.length, absolute });
    }
    return await prisma.$transaction(async (transaction) => {
      const shipment = await transaction.sampleShipment.create({ data: { testingApplicationId: application.id, shippingDate: new Date(`${parsed.data.shippingDate}T00:00:00.000Z`), shippingMethod: parsed.data.shippingMethod, carrierName: parsed.data.carrierName || null, trackingNumber: parsed.data.trackingNumber || null, packageCount: parsed.data.packageCount, conditionNotes: parsed.data.conditionNotes || null, senderName: parsed.data.senderName, createdById: BigInt(owner.userId), evidence: { create: saved.map((file) => ({ fileName: file.fileName, filePath: file.filePath, mimeType: file.mimeType, fileSize: BigInt(file.fileSize) })) } } });
      await transaction.testingApplication.update({ where: { id: application.id }, data: { status: "SAMPEL_DIKIRIM" } });
      const officers = await transaction.user.findMany({ where: { deletedAt: null, status: "ACTIVE", roles: { some: { role: { code: "PETUGAS_PENERIMAAN_SAMPEL" } } } }, select: { id: true } });
      await transaction.notification.createMany({ data: officers.map(({ id }) => ({ userId: id, title: "Sampel sedang dikirim", message: `Pelaku usaha telah membuat Berita Pengiriman Sampel untuk ${application.applicationNumber ?? "permohonan pengujian"}.`, href: `/dashboard/quality-testing/sample-reception/${application.id}` })) });
      await transaction.auditLog.create({ data: { actorUserId: BigInt(owner.userId), businessId: owner.businessId, action: AuditAction.STATUS_CHANGE, entityType: "SAMPLE_SHIPMENT", entityId: shipment.id.toString(), previousValue: { status: "MENUNGGU_SAMPEL" }, newValue: { status: "SAMPEL_DIKIRIM" }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      return { id: shipment.id.toString() };
    });
  } catch (error) { await Promise.all(saved.map(({ absolute }) => unlink(absolute).catch(() => undefined))); throw error; }
}

export async function receiveSampleShipment(userId: string, applicationId: string, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const application = await transaction.testingApplication.findFirst({
      where: { id: BigInt(applicationId), status: "SAMPEL_DIKIRIM", deletedAt: null, sampleShipment: { isNot: null } },
      select: { id: true, status: true, applicationNumber: true, businessProfile: { select: { businessId: true } } },
    });
    if (!application) throw new Error("INVALID_STATUS");

    const updated = await transaction.testingApplication.update({ where: { id: application.id }, data: { status: "KAJI_ULANG" } });
    const recipients = await transaction.businessMember.findMany({
      where: { businessId: application.businessProfile.businessId, status: "ACTIVE", deletedAt: null },
      select: { userId: true },
    });
    await transaction.notification.createMany({ data: recipients.map(({ userId: recipientId }) => ({
      userId: recipientId,
      title: "Sampel telah diterima",
      message: `Sampel untuk permohonan ${application.applicationNumber ?? "pengujian"} telah diterima oleh petugas laboratorium.`,
      href: `/dashboard/permohonan/${application.id}`,
    })) });
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(userId), businessId: application.businessProfile.businessId,
      action: AuditAction.STATUS_CHANGE, entityType: "SAMPLE_RECEPTION", entityId: application.id.toString(),
      previousValue: { status: application.status }, newValue: { status: "KAJI_ULANG" },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    } });
    return { id: updated.id.toString(), status: updated.status };
  });
}

export async function serveSampleShipmentEvidence(applicationId: string, evidenceId: string): Promise<Response> {
  const evidence = await prisma.sampleShipmentEvidence.findFirst({
    where: { id: BigInt(evidenceId), shipment: { testingApplicationId: BigInt(applicationId), application: { deletedAt: null } } },
    select: { fileName: true, filePath: true, mimeType: true },
  });
  if (!evidence) throw new Error("NOT_FOUND");
  try {
    const absolute = resolveTarget(evidence.filePath);
    const [bytes, fileStat] = await Promise.all([readFile(absolute), stat(absolute)]);
    if (!fileStat.isFile()) throw new Error("FILE_UNAVAILABLE");
    const fileName = sanitizeOriginalFileName(evidence.fileName);
    const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(Uint8Array.from(bytes), { headers: {
      "Content-Type": evidence.mimeType, "Content-Length": fileStat.size.toString(),
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store, max-age=0",
    } });
  } catch (error: unknown) {
    console.error("Sample shipment evidence is unavailable", { applicationId, evidenceId, error });
    throw new Error("FILE_UNAVAILABLE", { cause: error });
  }
}
