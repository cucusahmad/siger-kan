import { z } from "zod";

const referenceId = z.string().regex(/^\d+$/, "Pilihan wajib diisi.");
const decimal = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Gunakan angka dengan maksimal 2 desimal.");
const optionalDecimal = z.union([z.literal(""), decimal]);

export const businessNeedInputSchema = z.object({
  title: z.string().trim().min(5, "Judul kebutuhan minimal 5 karakter.").max(180),
  commodityId: referenceId,
  categoryId: referenceId,
  unitId: referenceId,
  description: z.string().trim().min(20, "Deskripsi kebutuhan minimal 20 karakter.").max(5000),
  specifications: z.string().trim().max(3000),
  quantity: decimal.refine((value) => Number(value) > 0, "Jumlah harus lebih dari 0."),
  minimumBudget: optionalDecimal,
  maximumBudget: optionalDecimal,
  isBudgetNegotiable: z.boolean(),
  deliveryLocation: z.string().trim().min(5, "Lokasi pengiriman wajib diisi.").max(300),
  requiredAt: z.union([z.literal(""), z.iso.date()]),
}).superRefine((value, context) => {
  if (value.minimumBudget && value.maximumBudget && Number(value.maximumBudget) < Number(value.minimumBudget)) {
    context.addIssue({ code: "custom", path: ["maximumBudget"], message: "Anggaran maksimum tidak boleh lebih kecil dari anggaran minimum." });
  }
  if (value.requiredAt && new Date(`${value.requiredAt}T23:59:59`) < new Date()) {
    context.addIssue({ code: "custom", path: ["requiredAt"], message: "Tanggal kebutuhan tidak boleh berada di masa lalu." });
  }
});

export const businessNeedActionSchema = z.object({
  action: z.enum(["PUBLISH", "CLOSE", "REOPEN"]),
});

export type BusinessNeedInput = z.infer<typeof businessNeedInputSchema>;
