import { z } from "zod";

const commodityIdSchema = z.string().regex(/^\d+$/, "Komoditas tidak valid.");

export const businessCommoditiesSchema = z.object({
  primaryCommodityId: commodityIdSchema,
  secondaryCommodityIds: z.array(commodityIdSchema).max(99, "Maksimal 99 komoditas pendukung."),
  otherDescriptions: z.record(commodityIdSchema, z.string().trim().max(200, "Keterangan maksimal 200 karakter.")),
}).superRefine((value, context) => {
  if (value.secondaryCommodityIds.includes(value.primaryCommodityId)) {
    context.addIssue({ code: "custom", path: ["secondaryCommodityIds"], message: "Komoditas utama tidak boleh dipilih sebagai komoditas pendukung." });
  }
  if (new Set(value.secondaryCommodityIds).size !== value.secondaryCommodityIds.length) {
    context.addIssue({ code: "custom", path: ["secondaryCommodityIds"], message: "Komoditas pendukung tidak boleh duplikat." });
  }
});

export type BusinessCommoditiesInput = z.infer<typeof businessCommoditiesSchema>;
