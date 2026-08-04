import { z } from "zod";

const requiredText = z.string().trim().min(1, "Wajib diisi").max(500);
const optionalText = z.string().trim().max(500);
const draftContactSchema = z.object({ name: optionalText, position: optionalText, phone: optionalText, email: z.string().trim().max(320) });

const productDraftSchema = z.object({
  productName: optionalText,
  catalogNumber: optionalText,
  uniqueIdentification: optionalText,
  rujukanSniIds: z.array(z.string().regex(/^\d+$/)).max(50).default([]),
  pempekTypes: z.array(z.enum(["BOILED", "FRIED", "GRILLED"])).max(3).default([]),
  existingScope: z.string().trim().max(1000).default(""),
  proposedScope: z.string().trim().max(1000).default(""),
  additionalInformation: z.string().trim().max(1000, "Maksimal 1.000 karakter").default(""),
});

export const certificationDraftSchema = z.object({
  type: z.enum(["INITIAL", "RECERTIFICATION", "SCOPE_EXTENSION"]),
  contactPerson: draftContactSchema,
  recipientSameAsApplicant: z.boolean(),
  certificateRecipient: draftContactSchema.optional(),
  productInformation: productDraftSchema,
  manufacturingInformation: z.object({ factoryName: optionalText, factoryAddress: optionalText, responsiblePerson: optionalText, responsiblePosition: optionalText, contactPerson: optionalText, contactAddress: optionalText }),
  requirementsAccepted: z.boolean(),
  licenseAgreementAccepted: z.boolean(),
});

export const certificationSubmissionSchema = certificationDraftSchema.superRefine((value, context) => {
  if (!value.contactPerson.name || !value.contactPerson.position || !value.contactPerson.phone || !z.string().email().safeParse(value.contactPerson.email).success) context.addIssue({ code: "custom", path: ["contactPerson"], message: "Personel penghubung wajib dilengkapi" });
  if (!value.recipientSameAsApplicant && (!value.certificateRecipient?.name || !value.certificateRecipient.position || !value.certificateRecipient.phone || !z.string().email().safeParse(value.certificateRecipient.email).success)) context.addIssue({ code: "custom", path: ["certificateRecipient"], message: "Penerima sertifikat wajib dilengkapi" });
  if (!value.productInformation.productName) context.addIssue({ code: "custom", path: ["productInformation", "productName"], message: "Nama produk wajib diisi" });
  if (!value.productInformation.rujukanSniIds.length) context.addIssue({ code: "custom", path: ["productInformation", "rujukanSniIds"], message: "Pilih minimal satu standar kesesuaian" });
  if (new Set(value.productInformation.rujukanSniIds).size !== value.productInformation.rujukanSniIds.length) context.addIssue({ code: "custom", path: ["productInformation", "rujukanSniIds"], message: "Standar tidak boleh dipilih berulang" });
  if (value.type === "SCOPE_EXTENSION" && (!value.productInformation.existingScope || !value.productInformation.proposedScope)) context.addIssue({ code: "custom", path: ["productInformation", "proposedScope"], message: "Ruang lingkup lama dan baru wajib dijelaskan" });
  if (Object.values(value.manufacturingInformation).some((item) => !item)) context.addIssue({ code: "custom", path: ["manufacturingInformation"], message: "Informasi pembuatan produk wajib dilengkapi" });
});

export const certificationReviewSchema = z.object({ decision: z.enum(["VERIFIED", "REVISION_REQUIRED"]), notes: z.string().trim().max(3000) }).superRefine((value, context) => { if (value.decision === "REVISION_REQUIRED" && value.notes.length < 10) context.addIssue({ code: "custom", path: ["notes"], message: "Catatan perbaikan minimal 10 karakter" }); });

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
