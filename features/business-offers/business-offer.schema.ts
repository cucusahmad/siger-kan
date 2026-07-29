import { z } from "zod";

const decimal = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Gunakan angka dengan maksimal 2 desimal.");

export const businessOfferInputSchema = z.object({
  businessNeedId: z.string().regex(/^\d+$/, "Peluang tidak valid."),
  quantity: decimal.refine((value) => Number(value) > 0, "Jumlah harus lebih dari 0."),
  unitPrice: decimal.refine((value) => Number(value) > 0, "Harga satuan harus lebih dari 0."),
  leadTimeDays: z.number().int().min(1, "Waktu pengiriman minimal 1 hari.").max(365),
  validUntil: z.iso.date(),
  message: z.string().trim().min(20, "Pesan penawaran minimal 20 karakter.").max(3000),
}).superRefine((value, context) => {
  if (new Date(`${value.validUntil}T23:59:59`) < new Date()) {
    context.addIssue({ code: "custom", path: ["validUntil"], message: "Masa berlaku harus berada di masa mendatang." });
  }
});

export const businessOfferActionSchema = z.object({
  action: z.enum(["WITHDRAW", "ACCEPT", "REJECT"]),
  notes: z.string().trim().max(1000).default(""),
});

export type BusinessOfferInput = z.infer<typeof businessOfferInputSchema>;
