import { z } from "zod";

export const productVerificationSchema = z.object({
  decision: z.enum(["APPROVE", "REVISION", "REJECT"]),
  notes: z.string().trim().max(1000, "Catatan maksimal 1.000 karakter."),
}).superRefine((value, context) => {
  if (value.decision !== "APPROVE" && value.notes.length < 5) {
    context.addIssue({ code: "custom", path: ["notes"], message: "Catatan minimal 5 karakter untuk perbaikan atau penolakan." });
  }
});

export interface ProductVerificationInput {
  readonly decision: "APPROVE" | "REVISION" | "REJECT";
  readonly notes: string;
}

