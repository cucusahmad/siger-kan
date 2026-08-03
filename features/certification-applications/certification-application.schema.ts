import { z } from "zod";

const requiredText = z.string().trim().min(1, "Wajib diisi").max(500);
const contactSchema = z.object({ name: requiredText, position: requiredText, phone: requiredText, email: z.string().trim().email("Email tidak valid") });

export const certificationSubmissionSchema = z.object({
  type: z.enum(["INITIAL", "RECERTIFICATION", "SCOPE_EXTENSION"]),
  contactPerson: contactSchema,
  recipientSameAsApplicant: z.boolean(),
  certificateRecipient: contactSchema.optional(),
  productInformation: z.object({ productName: requiredText, catalogNumber: requiredText, uniqueIdentification: requiredText, conformityStandard: requiredText }),
  manufacturingInformation: z.object({ factoryName: requiredText, factoryAddress: requiredText, responsiblePerson: requiredText, responsiblePosition: requiredText, contactPerson: requiredText, contactAddress: requiredText }),
  requirementsAccepted: z.boolean(),
  licenseAgreementAccepted: z.boolean(),
}).superRefine((value, context) => {
  if (!value.recipientSameAsApplicant && !value.certificateRecipient) context.addIssue({ code: "custom", path: ["certificateRecipient"], message: "Penerima sertifikat wajib dilengkapi" });
});

const draftText = z.string().trim().max(500);
const draftContactSchema = z.object({ name: draftText, position: draftText, phone: draftText, email: z.string().trim().max(320) });
export const certificationDraftSchema = z.object({
  type: z.enum(["INITIAL", "RECERTIFICATION", "SCOPE_EXTENSION"]), contactPerson: draftContactSchema,
  recipientSameAsApplicant: z.boolean(), certificateRecipient: draftContactSchema.optional(),
  productInformation: z.object({ productName: draftText, catalogNumber: draftText, uniqueIdentification: draftText, conformityStandard: draftText }),
  manufacturingInformation: z.object({ factoryName: draftText, factoryAddress: draftText, responsiblePerson: draftText, responsiblePosition: draftText, contactPerson: draftText, contactAddress: draftText }),
  requirementsAccepted: z.boolean(), licenseAgreementAccepted: z.boolean(),
});

export const certificationReviewSchema = z.object({
  decision: z.enum(["VERIFIED", "REVISION_REQUIRED"]),
  notes: z.string().trim().max(3000),
}).superRefine((value, context) => {
  if (value.decision === "REVISION_REQUIRED" && value.notes.length < 10) context.addIssue({ code: "custom", path: ["notes"], message: "Catatan perbaikan minimal 10 karakter" });
});

export type CertificationDraftInput = z.infer<typeof certificationDraftSchema>;
export type CertificationReviewInput = z.infer<typeof certificationReviewSchema>;

const evaluatorSchema = z.object({ name: requiredText, role: requiredText });
export const certificationWorkflowSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ISSUE_INVOICE"), feeDetails: z.object({ reference: requiredText, amount: z.number().positive(), dueDate: z.iso.datetime(), description: requiredText }), proposedEvaluators: z.array(evaluatorSchema).min(1) }),
  z.object({ action: z.literal("SUBMIT_PAYMENT") }),
  z.object({ action: z.literal("VERIFY_PAYMENT"), assignedEvaluators: z.array(evaluatorSchema).min(1), notes: z.string().trim().max(3000).default("") }),
  z.object({ action: z.literal("SCHEDULE_AUDIT"), auditSchedule: z.object({ startAt: z.iso.datetime(), endAt: z.iso.datetime(), location: requiredText, agenda: requiredText }) }),
  z.object({ action: z.literal("CONFIRM_SCHEDULE") }),
  z.object({ action: z.literal("RECORD_AUDIT"), auditReport: z.object({ productionProcess: requiredText, qualitySystem: requiredText, facilities: requiredText, supportingDocuments: requiredText, marketProductCondition: z.string().trim().max(3000), conclusion: requiredText, hasNonconformity: z.boolean(), nonconformityDetails: z.string().trim().max(3000) }) }),
  z.object({ action: z.literal("SUBMIT_CORRECTIVE_ACTION"), notes: requiredText }),
  z.object({ action: z.literal("VERIFY_CORRECTIVE_ACTION"), accepted: z.boolean(), notes: requiredText }),
]);
export type CertificationWorkflowInput = z.infer<typeof certificationWorkflowSchema>;
