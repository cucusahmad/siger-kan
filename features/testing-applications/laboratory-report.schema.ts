import { z } from "zod";

export const submitLaboratoryReportSchema = z.object({
  testingApplicationId: z.string().regex(/^\d+$/),
  reportNumber: z.string().trim().min(5).max(64),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  conclusion: z.string().trim().min(20).max(5000),
  notes: z.string().trim().max(3000).default(""),
});

export const decideLaboratoryReportSchema = z.object({
  decision: z.enum(["SETUJUI", "KEMBALIKAN"]),
  notes: z.string().trim().max(3000).default(""),
}).superRefine((value, context) => {
  if (value.decision === "KEMBALIKAN" && value.notes.length < 10) context.addIssue({ code: "custom", path: ["notes"], message: "Alasan pengembalian minimal 10 karakter." });
});
