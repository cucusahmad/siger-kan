import { AuditAction, Prisma, QualityClinicAppointmentStatus, SystemRoleCode } from "@/app/generated/prisma/client";
import { resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { CreateClinicAppointmentInput, UpdateClinicAppointmentInput } from "./quality-clinic.schema";
import type { ClinicAppointmentPageData, ClinicAppointmentView } from "./quality-clinic.types";

interface ClinicActor {
  readonly id: string;
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
}

const appointmentInclude = {
  business: { select: { name: true, profile: { select: { tradeName: true } } } },
  requester: { select: { profile: { select: { fullName: true } } } },
  consultant: { select: { profile: { select: { fullName: true } } } },
} satisfies Prisma.QualityClinicAppointmentInclude;

type AppointmentRecord = Prisma.QualityClinicAppointmentGetPayload<{ include: typeof appointmentInclude }>;

function isConsultant(actor: ClinicActor): boolean {
  return actor.roleCodes.includes(SystemRoleCode.KONSULTAN_MUTU);
}

function ensureAccess(actor: ClinicActor): void {
  if (!actor.permissions.includes("consultation.read") || !actor.roleCodes.some((role) => role === SystemRoleCode.PELAKU_USAHA || role === SystemRoleCode.KONSULTAN_MUTU)) throw new Error("FORBIDDEN");
}

export async function getClinicAppointments(actor: ClinicActor): Promise<ClinicAppointmentPageData> {
  ensureAccess(actor);
  const consultant = isConsultant(actor);
  const membership = consultant ? null : await resolveCurrentBusiness(actor.id);
  if (!consultant && !membership) throw new Error("BUSINESS_NOT_FOUND");
  const appointments = await prisma.qualityClinicAppointment.findMany({
    where: { deletedAt: null, ...(consultant ? {} : { businessId: membership!.businessId }) },
    orderBy: [{ preferredAt: "desc" }, { id: "desc" }],
    take: 100,
    include: appointmentInclude,
  });
  return { isConsultant: consultant, appointments: appointments.map(serializeAppointment) };
}

export async function createClinicAppointment(actor: ClinicActor, input: CreateClinicAppointmentInput, context: RequestContext): Promise<ClinicAppointmentView> {
  ensureAccess(actor);
  if (isConsultant(actor) || !actor.permissions.includes("consultation.create")) throw new Error("FORBIDDEN");
  const membership = await resolveCurrentBusiness(actor.id);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const appointment = await prisma.$transaction(async (transaction) => {
    const created = await transaction.qualityClinicAppointment.create({
      data: { businessId: membership.businessId, requesterId: BigInt(actor.id), topic: input.topic.trim(), description: input.description.trim(), preferredAt: input.preferredAt },
      include: appointmentInclude,
    });
    await transaction.auditLog.create({ data: auditData(actor, context, membership.businessId, AuditAction.CREATE, created.id, { preferredAt: input.preferredAt.toISOString() }) });
    return created;
  });
  return serializeAppointment(appointment);
}

export async function updateClinicAppointment(actor: ClinicActor, appointmentId: string, input: UpdateClinicAppointmentInput, context: RequestContext): Promise<ClinicAppointmentView> {
  ensureAccess(actor);
  if (!/^\d+$/.test(appointmentId)) throw new Error("NOT_FOUND");
  const consultant = isConsultant(actor);
  const membership = consultant ? null : await resolveCurrentBusiness(actor.id);
  const appointment = await prisma.qualityClinicAppointment.findFirst({ where: { id: BigInt(appointmentId), deletedAt: null, ...(consultant ? {} : { businessId: membership?.businessId ?? BigInt(-1) }) } });
  if (!appointment) throw new Error("NOT_FOUND");
  if (appointment.status === QualityClinicAppointmentStatus.COMPLETED || appointment.status === QualityClinicAppointmentStatus.REJECTED || appointment.status === QualityClinicAppointmentStatus.CANCELLED) throw new Error("FINAL_STATUS");
  if (input.action === "CANCEL") {
    if (consultant || appointment.requesterId !== BigInt(actor.id)) throw new Error("FORBIDDEN");
  } else if (!consultant || !actor.permissions.includes("consultation.respond")) throw new Error("FORBIDDEN");
  if (input.action === "COMPLETE" && appointment.status !== QualityClinicAppointmentStatus.CONFIRMED) throw new Error("INVALID_TRANSITION");

  const status = input.action === "CONFIRM" ? QualityClinicAppointmentStatus.CONFIRMED : input.action === "COMPLETE" ? QualityClinicAppointmentStatus.COMPLETED : input.action === "REJECT" ? QualityClinicAppointmentStatus.REJECTED : QualityClinicAppointmentStatus.CANCELLED;
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.qualityClinicAppointment.update({
      where: { id: appointment.id },
      data: {
        status,
        ...(input.action === "CONFIRM" ? { consultantId: BigInt(actor.id), scheduledAt: input.scheduledAt, location: input.location.trim(), consultantNote: input.consultantNote?.trim() || null } : {}),
        ...(input.action === "COMPLETE" || input.action === "REJECT" ? { consultantId: BigInt(actor.id), consultantNote: input.consultantNote?.trim() || null } : {}),
      },
      include: appointmentInclude,
    });
    if (consultant) await transaction.notification.create({ data: { userId: appointment.requesterId, title: "Jadwal Klinik Mutu diperbarui", message: `Status pertemuan ${appointment.topic} diperbarui menjadi ${status}.`, href: "/dashboard/quality-clinic" } });
    await transaction.auditLog.create({ data: auditData(actor, context, appointment.businessId, AuditAction.STATUS_CHANGE, appointment.id, { action: input.action, status }) });
    return value;
  });
  return serializeAppointment(updated);
}

function auditData(actor: ClinicActor, context: RequestContext, businessId: bigint, action: AuditAction, entityId: bigint, metadata: Prisma.InputJsonValue) {
  return { actorUserId: BigInt(actor.id), businessId, action, entityType: "QUALITY_CLINIC_APPOINTMENT", entityId: entityId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata };
}

function serializeAppointment(item: AppointmentRecord): ClinicAppointmentView {
  return { id: item.id.toString(), businessName: item.business.profile?.tradeName || item.business.name, requesterName: item.requester.profile?.fullName ?? "Pelaku Usaha", consultantName: item.consultant?.profile?.fullName ?? null, topic: item.topic, description: item.description, preferredAt: item.preferredAt.toISOString(), scheduledAt: item.scheduledAt?.toISOString() ?? null, location: item.location, consultantNote: item.consultantNote, status: item.status, createdAt: item.createdAt.toISOString() };
}

export function getClinicAppointmentError(error: unknown): { readonly status: number; readonly message: string } {
  if (!(error instanceof Error)) return { status: 500, message: "Layanan Klinik Mutu belum dapat diproses." };
  const errors: Readonly<Record<string, { readonly status: number; readonly message: string }>> = {
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki akses untuk tindakan ini." },
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    NOT_FOUND: { status: 404, message: "Jadwal Klinik Mutu tidak ditemukan." },
    FINAL_STATUS: { status: 409, message: "Jadwal ini sudah berstatus akhir dan tidak dapat diubah." },
    INVALID_TRANSITION: { status: 409, message: "Pertemuan harus dikonfirmasi sebelum dapat diselesaikan." },
  };
  return errors[error.message] ?? { status: 500, message: "Layanan Klinik Mutu belum dapat diproses. Silakan coba kembali." };
}
