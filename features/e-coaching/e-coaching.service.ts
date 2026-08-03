import {
  AuditAction,
  ConsultationStatus,
  Prisma,
  SystemRoleCode,
} from "@/app/generated/prisma/client";
import { resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { ConsultationActionInput, CreateConsultationInput } from "./e-coaching.schema";
import type { ConsultationPageData, ConsultationView } from "./e-coaching.types";
import { deleteConsultationFile, readConsultationFile, saveConsultationFile, type ConsultationFileInput } from "./consultation-attachment-storage";

interface ConsultationActor {
  readonly id: string;
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
}

const consultationInclude = {
  business: { select: { name: true, profile: { select: { tradeName: true } } } },
  requester: { select: { profile: { select: { fullName: true } } } },
  consultant: { select: { profile: { select: { fullName: true } } } },
  messages: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      sender: { select: { roles: { include: { role: { select: { code: true } } } }, profile: { select: { fullName: true } } } },
      attachments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  },
  attachments: { where: { messageId: null, deletedAt: null }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.QualityConsultationInclude;

type ConsultationRecord = Prisma.QualityConsultationGetPayload<{ include: typeof consultationInclude }>;

function isConsultant(actor: ConsultationActor): boolean {
  return actor.roleCodes.includes(SystemRoleCode.KONSULTAN_MUTU);
}

function ensureModuleAccess(actor: ConsultationActor) {
  if (!actor.roleCodes.some((role) => role === SystemRoleCode.PELAKU_USAHA || role === SystemRoleCode.KONSULTAN_MUTU)) {
    throw new Error("FORBIDDEN");
  }
  if (!actor.permissions.includes("consultation.read")) throw new Error("FORBIDDEN");
}

export async function getConsultations(actor: ConsultationActor): Promise<ConsultationPageData> {
  ensureModuleAccess(actor);
  const consultant = isConsultant(actor);
  const membership = consultant ? null : await resolveCurrentBusiness(actor.id);
  if (!consultant && !membership) throw new Error("BUSINESS_NOT_FOUND");
  const consultations = await prisma.qualityConsultation.findMany({
    where: {
      deletedAt: null,
      ...(consultant ? {} : { businessId: membership!.businessId }),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 100,
    include: consultationInclude,
  });
  return { isConsultant: consultant, consultations: consultations.map(serializeConsultation) };
}

export async function createConsultation(actor: ConsultationActor, input: CreateConsultationInput, files: readonly ConsultationFileInput[], context: RequestContext) {
  ensureModuleAccess(actor);
  if (isConsultant(actor) || !actor.permissions.includes("consultation.create")) throw new Error("FORBIDDEN");
  const membership = await resolveCurrentBusiness(actor.id);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const storedFiles: string[] = [];
  try {
    const consultation = await prisma.$transaction(async (transaction) => {
    const created = await transaction.qualityConsultation.create({
      data: {
        businessId: membership.businessId,
        requesterId: BigInt(actor.id),
        subject: input.subject.trim(),
        category: input.category,
        question: input.question.trim(),
      },
    });
    for (const file of files) {
      const storageKey = await saveConsultationFile(created.id, file);
      storedFiles.push(storageKey);
      await transaction.consultationAttachment.create({ data: { consultationId: created.id, uploadedById: BigInt(actor.id), fileName: file.originalName, storageKey, mimeType: file.mimeType, fileSize: file.size } });
    }
    await transaction.auditLog.create({ data: auditData(actor, context, membership.businessId, AuditAction.CREATE, created.id, { category: input.category }) });
    return transaction.qualityConsultation.findUniqueOrThrow({ where: { id: created.id }, include: consultationInclude });
  });
    return serializeConsultation(consultation);
  } catch (error: unknown) {
    await Promise.all(storedFiles.map((storageKey) => deleteConsultationFile(storageKey)));
    throw error;
  }
}

export async function updateConsultation(actor: ConsultationActor, consultationId: string, input: ConsultationActionInput, files: readonly ConsultationFileInput[], context: RequestContext) {
  ensureModuleAccess(actor);
  if (!/^\d+$/.test(consultationId)) throw new Error("NOT_FOUND");
  const consultant = isConsultant(actor);
  const membership = consultant ? null : await resolveCurrentBusiness(actor.id);
  const consultation = await prisma.qualityConsultation.findFirst({
    where: { id: BigInt(consultationId), deletedAt: null, ...(consultant ? {} : { businessId: membership?.businessId ?? BigInt(-1) }) },
    include: consultationInclude,
  });
  if (!consultation) throw new Error("NOT_FOUND");
  if (input.action === "CLOSE") {
    const isOwner = consultation.requesterId === BigInt(actor.id);
    if (!consultant && !isOwner) throw new Error("FORBIDDEN");
    return changeToClosed(actor, consultation, context);
  }
  if (!consultant || !actor.permissions.includes("consultation.respond")) throw new Error("FORBIDDEN");
  if (consultation.status === ConsultationStatus.CLOSED) throw new Error("CLOSED");
  return addResponse(actor, consultation, input.message, files, context);
}

async function addResponse(actor: ConsultationActor, consultation: ConsultationRecord, message: string, files: readonly ConsultationFileInput[], context: RequestContext) {
  const storedFiles: string[] = [];
  try {
    const updated = await prisma.$transaction(async (transaction) => {
    const createdMessage = await transaction.consultationMessage.create({ data: { consultationId: consultation.id, senderId: BigInt(actor.id), message: message.trim() } });
    for (const file of files) {
      const storageKey = await saveConsultationFile(consultation.id, file);
      storedFiles.push(storageKey);
      await transaction.consultationAttachment.create({ data: { consultationId: consultation.id, messageId: createdMessage.id, uploadedById: BigInt(actor.id), fileName: file.originalName, storageKey, mimeType: file.mimeType, fileSize: file.size } });
    }
    const value = await transaction.qualityConsultation.update({
      where: { id: consultation.id },
      data: { consultantId: BigInt(actor.id), status: ConsultationStatus.ANSWERED, answeredAt: new Date() },
      include: consultationInclude,
    });
    await transaction.notification.create({ data: { userId: consultation.requesterId, title: "Konsultasi telah dijawab", message: `Konsultan telah menjawab: ${consultation.subject}`, href: "/dashboard/e-coaching/consultations" } });
    await transaction.auditLog.create({ data: auditData(actor, context, consultation.businessId, AuditAction.UPDATE, consultation.id, { action: "RESPOND" }) });
    return value;
  });
    return serializeConsultation(updated);
  } catch (error: unknown) {
    await Promise.all(storedFiles.map((storageKey) => deleteConsultationFile(storageKey)));
    throw error;
  }
}

async function changeToClosed(actor: ConsultationActor, consultation: ConsultationRecord, context: RequestContext) {
  if (consultation.status === ConsultationStatus.CLOSED) throw new Error("CLOSED");
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.qualityConsultation.update({ where: { id: consultation.id }, data: { status: ConsultationStatus.CLOSED, closedAt: new Date() }, include: consultationInclude });
    await transaction.auditLog.create({ data: auditData(actor, context, consultation.businessId, AuditAction.STATUS_CHANGE, consultation.id, { action: "CLOSE" }) });
    return value;
  });
  return serializeConsultation(updated);
}

function auditData(actor: ConsultationActor, context: RequestContext, businessId: bigint, action: AuditAction, entityId: bigint, metadata: Prisma.InputJsonValue) {
  return { actorUserId: BigInt(actor.id), businessId, action, entityType: "QUALITY_CONSULTATION", entityId: entityId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata };
}

function serializeConsultation(item: ConsultationRecord): ConsultationView {
  return {
    id: item.id.toString(),
    subject: item.subject,
    category: item.category,
    businessName: item.business.profile?.tradeName || item.business.name,
    requesterName: item.requester.profile?.fullName ?? "Pelaku Usaha",
    status: item.status,
    question: item.question,
    createdAt: item.createdAt.toISOString(),
    attachments: item.attachments.map(serializeAttachment),
    messages: item.messages.map((message) => ({
      id: message.id.toString(),
      senderName: message.sender.profile?.fullName ?? "Pengguna SIGER-KAN",
      isConsultant: message.sender.roles.some(({ role }) => role.code === SystemRoleCode.KONSULTAN_MUTU),
      message: message.message,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments.map(serializeAttachment),
    })),
  };
}

function serializeAttachment(item: { readonly id: bigint; readonly fileName: string; readonly mimeType: string; readonly fileSize: bigint }) {
  return { id: item.id.toString(), fileName: item.fileName, mimeType: item.mimeType, fileSize: item.fileSize.toString(), downloadUrl: `/api/e-coaching/attachments/${item.id}/download` };
}

export async function getConsultationAttachment(actor: ConsultationActor, attachmentId: string) {
  ensureModuleAccess(actor);
  if (!/^\d+$/.test(attachmentId)) throw new Error("NOT_FOUND");
  const consultant = isConsultant(actor);
  const membership = consultant ? null : await resolveCurrentBusiness(actor.id);
  const attachment = await prisma.consultationAttachment.findFirst({
    where: { id: BigInt(attachmentId), deletedAt: null, consultation: { deletedAt: null, ...(consultant ? {} : { businessId: membership?.businessId ?? BigInt(-1) }) } },
  });
  if (!attachment) throw new Error("NOT_FOUND");
  return { fileName: attachment.fileName, mimeType: attachment.mimeType, bytes: await readConsultationFile(attachment.storageKey) };
}

export function getConsultationError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Layanan konsultasi belum dapat diproses." };
  const errors: Readonly<Record<string, { readonly status: number; readonly message: string }>> = {
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki akses untuk tindakan ini." },
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    NOT_FOUND: { status: 404, message: "Konsultasi tidak ditemukan." },
    CLOSED: { status: 409, message: "Konsultasi ini sudah ditutup." },
    INVALID_FILE: { status: 422, message: "Lampiran harus berupa PDF, JPG, PNG, atau DOCX dengan ukuran maksimal 10 MB." },
    TOO_MANY_FILES: { status: 422, message: "Maksimal 3 lampiran untuk setiap kiriman." },
    FILE_UNAVAILABLE: { status: 404, message: "Berkas lampiran tidak tersedia." },
  };
  return errors[error.message] ?? { status: 500, message: "Layanan konsultasi belum dapat diproses. Silakan coba kembali." };
}
