import { z } from "zod";

export const createClinicAppointmentSchema = z.object({
  topic: z.string().trim().min(5, "Topik minimal 5 karakter.").max(180),
  description: z.string().trim().min(20, "Kebutuhan konsultasi minimal 20 karakter.").max(5000),
  preferredAt: z.coerce.date().refine((value) => value.getTime() > Date.now(), "Jadwal pilihan harus pada waktu mendatang."),
});

export const updateClinicAppointmentSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CONFIRM"),
    scheduledAt: z.coerce.date().refine((value) => value.getTime() > Date.now(), "Jadwal pertemuan harus pada waktu mendatang."),
    location: z.string().trim().min(5, "Lokasi minimal 5 karakter.").max(300),
    consultantNote: z.string().trim().max(2000).optional(),
  }),
  z.object({ action: z.literal("COMPLETE"), consultantNote: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("REJECT"), consultantNote: z.string().trim().min(5, "Alasan penolakan minimal 5 karakter.").max(2000) }),
  z.object({ action: z.literal("CANCEL") }),
]);

export type CreateClinicAppointmentInput = z.infer<typeof createClinicAppointmentSchema>;
export type CreateClinicAppointmentFormInput = z.input<typeof createClinicAppointmentSchema>;
export type UpdateClinicAppointmentInput = z.infer<typeof updateClinicAppointmentSchema>;
