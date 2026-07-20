import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).default("");
const optionalNumber = z.string().trim().refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Nilai harus berupa angka positif.");

export const adminBusinessUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama usaha wajib diisi.").max(200), tradeName: optionalText(200), legalEntityType: optionalText(120), businessScale: optionalText(80),
  yearEstablished: z.string().trim().refine((value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= new Date().getFullYear()), "Tahun berdiri tidak valid."),
  employeeCount: optionalNumber, productionCapacity: optionalNumber, productionUnit: optionalText(80), picName: optionalText(160), picPosition: optionalText(160),
  email: z.union([z.literal(""), z.string().trim().email("Format email tidak valid.").max(320)]), phone: optionalText(32), whatsapp: optionalText(32), description: optionalText(3000),
  nib: optionalText(120), taxNumber: optionalText(120), siupNumber: optionalText(120), pirtNumber: optionalText(120), halalNumber: optionalText(120), distributionPermitNumber: optionalText(120),
});

export type AdminBusinessUpdateInput = z.output<typeof adminBusinessUpdateSchema>;
