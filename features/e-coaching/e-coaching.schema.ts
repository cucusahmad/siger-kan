import { z } from "zod";

export const createConsultationSchema = z.object({
  subject: z.string().trim().min(5, "Subjek minimal 5 karakter.").max(180),
  category: z.enum(["CERTIFICATION", "TEST_RESULT", "QUALITY_CLINIC", "BUSINESS_DEVELOPMENT", "OTHER"]),
  question: z.string().trim().min(20, "Pertanyaan minimal 20 karakter.").max(5000),
});

export const consultationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("RESPOND"),
    message: z.string().trim().min(5, "Jawaban minimal 5 karakter.").max(5000),
  }),
  z.object({
    action: z.literal("CLOSE"),
  }),
]);

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type ConsultationActionInput = z.infer<typeof consultationActionSchema>;
