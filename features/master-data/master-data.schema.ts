import { z } from "zod";

const code = z.string().trim().min(2, "Kode minimal 2 karakter.").max(50).regex(/^[A-Z0-9_-]+$/i, "Kode hanya boleh berisi huruf, angka, garis bawah, dan tanda hubung.");
const name = z.string().trim().min(2, "Nama minimal 2 karakter.").max(160);
const description = z.string().trim().max(1000).optional().default("");
const optionalReferenceId = z.union([z.literal(""), z.string().regex(/^\d+$/, "Referensi tidak valid.")]).default("");

export const commodityMasterSchema = z.object({
  code, name,
  scientificName: z.string().trim().max(180).optional().default(""),
  description,
  isActive: z.boolean(),
});

export const categoryMasterSchema = z.object({
  code,
  name,
  description,
  parentId: optionalReferenceId,
  isActive: z.boolean(),
});
export const unitMasterSchema = z.object({
  code, name,
  symbol: z.string().trim().min(1, "Simbol wajib diisi.").max(20),
  description,
  isActive: z.boolean(),
});
