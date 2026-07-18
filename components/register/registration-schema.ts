import { z } from "zod";

export const businessTypes = [
  "Pembudidaya",
  "Nelayan",
  "Pengolah",
  "Distributor",
  "Eksportir",
  "UMKM",
  "Lainnya",
] as const;

export const commodities = [
  "Udang",
  "Tuna",
  "Cakalang",
  "Bandeng",
  "Rumput Laut",
  "Kepiting",
  "Lobster",
  "Lainnya",
] as const;

export const lampungRegions = [
  "Kota Bandar Lampung",
  "Kota Metro",
  "Kabupaten Lampung Selatan",
  "Kabupaten Lampung Tengah",
  "Kabupaten Lampung Utara",
  "Kabupaten Lampung Barat",
  "Kabupaten Lampung Timur",
  "Kabupaten Tanggamus",
  "Kabupaten Tulang Bawang",
  "Kabupaten Way Kanan",
  "Kabupaten Pesawaran",
  "Kabupaten Pringsewu",
  "Kabupaten Mesuji",
  "Kabupaten Tulang Bawang Barat",
  "Kabupaten Pesisir Barat",
] as const;

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter."),
    email: z.string().trim().email("Masukkan alamat email yang valid."),
    phone: z
      .string()
      .trim()
      .regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, "Masukkan nomor handphone Indonesia yang valid."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .regex(/[A-Z]/, "Sertakan minimal satu huruf kapital.")
      .regex(/[a-z]/, "Sertakan minimal satu huruf kecil.")
      .regex(/[0-9]/, "Sertakan minimal satu angka."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
    businessName: z.string().trim().min(3, "Nama usaha minimal 3 karakter."),
    businessType: z.enum(businessTypes, { message: "Pilih jenis usaha." }),
    businessTypeOther: z.string().trim().max(200, "Penjelasan maksimal 200 karakter.").optional(),
    commodity: z.enum(commodities, { message: "Pilih komoditas utama." }),
    commodityOther: z.string().trim().max(200, "Penjelasan maksimal 200 karakter.").optional(),
    region: z.enum(lampungRegions, { message: "Pilih kabupaten atau kota." }),
    province: z.literal("Lampung"),
    terms: z.boolean().refine((accepted) => accepted, {
      message: "Anda perlu menyetujui syarat dan kebijakan privasi.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.businessType !== "Lainnya" || Boolean(data.businessTypeOther), {
    message: "Jelaskan jenis usaha lainnya.",
    path: ["businessTypeOther"],
  })
  .refine((data) => data.commodity !== "Lainnya" || Boolean(data.commodityOther), {
    message: "Jelaskan komoditas lainnya.",
    path: ["commodityOther"],
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
