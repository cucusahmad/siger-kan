import { z } from "zod";

export const assignWorkOrderSchema = z.object({
  analystId: z.string().regex(/^\d+$/), targetCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  testingMethod: z.string().trim().min(1).max(250), laboratoryEquipment: z.string().trim().min(1).max(250),
  laboratoryRoom: z.string().trim().min(1).max(160), workInstructions: z.string().trim().min(1).max(3000),
  priority: z.enum(["RENDAH", "NORMAL", "TINGGI", "MENDESAK"]),
}).refine((value) => value.targetCompletionDate >= new Date().toISOString().slice(0, 10), { path: ["targetCompletionDate"], message: "Target tidak boleh sebelum hari ini." });

export const analystSubmissionSchema = z.object({ analystNotes: z.string().trim().max(3000).default("") });

export const supervisorVerificationSchema = z.object({
  decision: z.enum(["SETUJUI", "KEMBALIKAN"]),
  notes: z.string().trim().max(3000),
}).superRefine((value, context) => {
  if (value.decision === "KEMBALIKAN" && value.notes.length < 10) {
    context.addIssue({ code: "custom", path: ["notes"], message: "Alasan pengembalian minimal 10 karakter." });
  }
});
