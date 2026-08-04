import { z } from "zod";

const jsonSection = z.record(z.string(), z.unknown()).default({});
const qualityAnswer = z.object({ answer: z.enum(["YES", "NO"]).nullable(), notes: z.string().trim().max(2000).default(""), evidence: z.string().trim().max(500).default("") });

export const certificationQuestionnaireDraftSchema = z.object({
  applicantInformation: jsonSection,
  productInformation: jsonSection,
  productionInformation: jsonSection,
  businessLegality: jsonSection,
  humanResources: jsonSection,
  certificationsAndProducts: jsonSection,
  marketingChannels: jsonSection,
  qualitySystemAnswers: z.array(qualityAnswer).length(27),
  sniEvaluation: jsonSection,
  otherNotes: z.string().trim().max(2000).default(""),
  declarationAccepted: z.boolean().default(false),
  signatoryName: z.string().trim().max(160).default(""),
  signatoryPosition: z.string().trim().max(160).default(""),
  approvalDate: z.string().date().or(z.literal("")),
  electronicSignatureAccepted: z.boolean().default(false),
});

export const certificationQuestionnaireSubmissionSchema = certificationQuestionnaireDraftSchema.superRefine((value, context) => {
  if (value.qualitySystemAnswers.some((item) => item.answer === null)) context.addIssue({ code: "custom", path: ["qualitySystemAnswers"], message: "Seluruh pertanyaan sistem mutu wajib dijawab" });
  if (!value.declarationAccepted) context.addIssue({ code: "custom", path: ["declarationAccepted"], message: "Pernyataan pemohon wajib disetujui" });
  if (!value.electronicSignatureAccepted || !value.signatoryName || !value.signatoryPosition || !value.approvalDate) context.addIssue({ code: "custom", path: ["signatoryName"], message: "Pengesahan wajib dilengkapi" });
  const percentage = Number(value.marketingChannels.totalPercentage ?? 0);
  if (percentage > 100) context.addIssue({ code: "custom", path: ["marketingChannels"], message: "Total persentase pemasaran tidak boleh melebihi 100%" });
});

export type CertificationQuestionnaireInput = z.infer<typeof certificationQuestionnaireDraftSchema>;
