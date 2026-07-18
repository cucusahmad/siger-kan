import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum, `Maksimal ${maximum} karakter.`).optional().default("");
const optionalUrl = z.string().trim().max(500, "Maksimal 500 karakter.").refine((value) => !value || /^https?:\/\//i.test(value), "Gunakan alamat lengkap yang diawali http:// atau https://.").optional().default("");
const phone = z.string().trim().max(32).refine((value) => !value || /^(?:\+62|62|0)[0-9\s()-]{7,20}$/.test(value), "Format nomor telepon Indonesia tidak valid.").optional().default("");
const legalNumber = z.string().trim().max(120).refine((value) => !value || /^[A-Za-z0-9./\s-]+$/.test(value), "Gunakan huruf, angka, spasi, titik, garis miring, atau tanda hubung.").optional().default("");
const id = z.string().trim().regex(/^\d+$/, "Pilihan tidak valid.");

export const businessProfileSchema = z.object({
  name: z.string().trim().min(2, "Nama usaha wajib diisi.").max(200, "Nama usaha maksimal 200 karakter."),
  tradeName: optionalText(200),
  businessType: z.enum(["FISH_FARMER", "FISHER", "PROCESSOR", "DISTRIBUTOR", "EXPORTER", "MSME", "OTHER"]),
  businessTypeOther: optionalText(160),
  legalEntityType: optionalText(120),
  businessScale: optionalText(80),
  yearEstablished: z.string().trim().refine((value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= new Date().getFullYear()), "Tahun berdiri harus valid dan tidak boleh di masa depan."),
  operationalStatus: optionalText(80),
  employeeCount: z.string().trim().refine((value) => !value || (/^\d+$/.test(value) && Number(value) <= 10_000_000), "Jumlah karyawan harus berupa angka positif."),
  productionCapacity: z.string().trim().refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Kapasitas produksi tidak boleh negatif."),
  productionUnit: optionalText(80),
  description: optionalText(3000),
  provinceId: id,
  regencyId: id,
  districtId: z.union([z.literal(""), id]),
  villageId: z.union([z.literal(""), id]),
  postalCode: z.string().trim().max(10).refine((value) => !value || /^\d{5}$/.test(value), "Kode pos harus terdiri dari 5 digit.").optional().default(""),
  addressLine: optionalText(1000),
  latitude: z.string().trim().refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= -90 && Number(value) <= 90), "Latitude harus berada antara -90 dan 90."),
  longitude: z.string().trim().refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= -180 && Number(value) <= 180), "Longitude harus berada antara -180 dan 180."),
  picName: optionalText(160),
  picPosition: optionalText(160),
  email: z.union([z.literal(""), z.string().trim().email("Format email usaha tidak valid.").max(320)]),
  phone,
  whatsapp: phone,
  website: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  tiktok: optionalUrl,
  nib: legalNumber,
  taxNumber: legalNumber,
  siupNumber: legalNumber,
  pirtNumber: legalNumber,
  halalNumber: legalNumber,
  distributionPermitNumber: legalNumber,
  otherLegalNumber: legalNumber,
  commodityIds: z.array(id).max(100, "Maksimal 100 komoditas.").refine((values) => new Set(values).size === values.length, "Komoditas tidak boleh duplikat."),
});

export type BusinessProfileFormValues = z.input<typeof businessProfileSchema>;
export type BusinessProfileInput = z.output<typeof businessProfileSchema>;

export function emptyToNull(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}
