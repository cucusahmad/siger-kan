import { z } from "zod";

const optionalDecimal = z.union([
  z.literal(""),
  z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Gunakan angka dengan maksimal 2 desimal."),
]);

const optionalInteger = z.union([
  z.literal(""),
  z.string().trim().regex(/^\d+$/, "Gunakan bilangan bulat."),
]);

const referenceId = z.string().regex(/^\d+$/, "Pilihan wajib diisi.");

export const productInputSchema = z.object({
  sku: z.string().trim().max(80, "SKU maksimal 80 karakter."),
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(160),
  brandName: z.string().trim().max(160),
  commodityId: referenceId,
  categoryId: referenceId,
  unitId: referenceId,
  shortDescription: z.string().trim().max(300),
  description: z.string().trim().max(5000, "Narasi maksimal 5.000 karakter."),
  packaging: z.string().trim().max(300),
  storageInstructions: z.string().trim().max(500),
  shelfLifeDays: optionalInteger,
  minimumPrice: optionalDecimal,
  maximumPrice: optionalDecimal,
  isPriceNegotiable: z.boolean(),
  isPriceVisible: z.boolean(),
  stockQuantity: optionalDecimal,
  minimumOrderQuantity: optionalDecimal,
  productionCapacity: optionalDecimal,
  productionCapacityPeriod: z.enum(["", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  availability: z.enum(["READY_STOCK", "PREORDER", "SEASONAL", "OUT_OF_STOCK"]),
  marketScope: z.enum(["LOCAL", "NATIONAL", "EXPORT"]),
}).superRefine((value, context) => {
  if (value.minimumPrice && value.maximumPrice && Number(value.maximumPrice) < Number(value.minimumPrice)) {
    context.addIssue({ code: "custom", path: ["maximumPrice"], message: "Harga maksimum tidak boleh lebih kecil dari harga minimum." });
  }
  if (value.productionCapacity && !value.productionCapacityPeriod) {
    context.addIssue({ code: "custom", path: ["productionCapacityPeriod"], message: "Periode kapasitas wajib dipilih." });
  }
});

export const productStatusInputSchema = z.object({
  action: z.enum(["SUBMIT", "ACTIVATE", "DEACTIVATE"]),
});

export type ProductInput = z.infer<typeof productInputSchema>;
