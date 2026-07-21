import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const idSchema = z.string().regex(/^\d+$/, "ID tidak valid.");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.").refine((value) => value <= new Date().toISOString().slice(0, 10), "Tanggal sampling tidak boleh melebihi hari ini.");

export const sampleSchema = z.object({
  id: idSchema.optional(), sampleName: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().positive(), weight: z.coerce.number().positive(),
  weightUnit: z.enum(["Gram", "Kilogram", "Mililiter", "Liter", "Unit", "Kemasan"]),
  packaging: z.string().trim().min(1).max(120),
  condition: z.enum(["BEKU", "DINGIN", "SEGAR", "KERING", "CAIR", "HIDUP", "LAINNYA"]),
  samplingDate: dateSchema, samplingLocation: z.string().trim().min(1).max(250),
  temperature: z.coerce.number().min(-100).max(200).optional().nullable(), description: optionalText(1000),
});

export const applicationParameterSchema = z.object({ sampleId: idSchema.optional(), sampleIndex: z.number().int().nonnegative().optional(), parameterId: idSchema }).refine((value) => value.sampleId !== undefined || value.sampleIndex !== undefined, "Sampel wajib dipilih.");

const baseApplicationSchema = z.object({
  laboratoryId: idSchema.optional().nullable(),
  purpose: z.enum(["EKSPOR", "DOMESTIK", "SERTIFIKASI", "INTERNAL", "LAINNYA"]).optional().nullable(),
  otherPurpose: optionalText(200), testingTypes: z.array(z.enum(["Mikrobiologi", "Kimia", "Fisika", "Organoleptik", "Pengujian Terpadu"])).max(5).default([]),
  product: z.object({ productName: optionalText(200), productType: optionalText(160), hsCode: optionalText(32), productForm: z.enum(["FRESH", "FROZEN", "FILLET", "OLAHAN", "KERING", "HIDUP", "LAINNYA"]).optional().nullable(), otherProductForm: optionalText(160), description: optionalText(2000) }).optional().nullable(),
  samples: z.array(sampleSchema.partial()).max(50).default([]),
  parameters: z.array(applicationParameterSchema).max(500).default([]),
  notes: optionalText(3000), declarationAccepted: z.boolean().default(false),
});

export const draftApplicationSchema = baseApplicationSchema.superRefine((value, context) => {
  if (value.purpose === "LAINNYA" && !value.otherPurpose) context.addIssue({ code: "custom", path: ["otherPurpose"], message: "Tujuan lainnya wajib diisi." });
  if (value.product?.productForm === "LAINNYA" && !value.product.otherProductForm) context.addIssue({ code: "custom", path: ["product", "otherProductForm"], message: "Bentuk produk lainnya wajib diisi." });
});

export const submitApplicationSchema = baseApplicationSchema.extend({
  laboratoryId: idSchema, purpose: z.enum(["EKSPOR", "DOMESTIK", "SERTIFIKASI", "INTERNAL", "LAINNYA"]),
  testingTypes: z.array(z.enum(["Mikrobiologi", "Kimia", "Fisika", "Organoleptik", "Pengujian Terpadu"])).min(1),
  product: z.object({ productName: z.string().trim().min(1), productType: z.string().trim().min(1), hsCode: optionalText(32), productForm: z.enum(["FRESH", "FROZEN", "FILLET", "OLAHAN", "KERING", "HIDUP", "LAINNYA"]), otherProductForm: optionalText(160), description: optionalText(2000) }),
  samples: z.array(sampleSchema).min(1), parameters: z.array(applicationParameterSchema).min(1), declarationAccepted: z.literal(true),
}).superRefine((value, context) => {
  if (value.purpose === "LAINNYA" && !value.otherPurpose) context.addIssue({ code: "custom", path: ["otherPurpose"], message: "Tujuan lainnya wajib diisi." });
  if (value.product.productForm === "LAINNYA" && !value.product.otherProductForm) context.addIssue({ code: "custom", path: ["product", "otherProductForm"], message: "Bentuk produk lainnya wajib diisi." });
});

export const applicationListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""), status: z.enum(["DRAFT", "DIAJUKAN", "PERLU_PERBAIKAN", "DISETUJUI", "MENUNGGU_SAMPEL", "SAMPEL_DITERIMA", "DALAM_PENGUJIAN", "SELESAI", "DITOLAK"]).optional(),
  from: z.string().optional(), to: z.string().optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(5).max(50).default(10),
});

export const receptionChecklistSchema = z.object({
  applicantData: z.boolean(),
  productData: z.boolean(),
  sampleData: z.boolean(),
  testingParameters: z.boolean(),
  supportingDocuments: z.boolean(),
});

export const receptionReviewSchema = z.object({
  decision: z.enum(["APPROVE", "REQUEST_REVISION"]),
  checklist: receptionChecklistSchema,
  notes: z.string().trim().max(3000).default(""),
}).superRefine((value, context) => {
  const isComplete = Object.values(value.checklist).every(Boolean);
  if (value.decision === "APPROVE" && !isComplete) context.addIssue({ code: "custom", path: ["checklist"], message: "Semua checklist wajib lengkap sebelum disetujui." });
  if (value.decision === "REQUEST_REVISION" && !value.notes) context.addIssue({ code: "custom", path: ["notes"], message: "Catatan kekurangan wajib diisi." });
});

export type DraftApplicationInput = z.infer<typeof draftApplicationSchema>;
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
export type ReceptionReviewInput = z.infer<typeof receptionReviewSchema>;
