import { z } from "zod";

import { BusinessType } from "@/app/generated/prisma/enums";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function normalizeIndonesianPhone(value: string): string {
  const compactPhone = value.trim().replace(/[\s().-]/g, "");

  if (compactPhone.startsWith("+62")) {
    return compactPhone;
  }

  if (compactPhone.startsWith("62")) {
    return `+${compactPhone}`;
  }

  if (compactPhone.startsWith("0")) {
    return `+62${compactPhone.slice(1)}`;
  }

  return compactPhone;
}

const nullableExplanation = z
  .union([z.string().trim().max(200, "Penjelasan maksimal 200 karakter."), z.null()])
  .optional()
  .transform((value) => value || null);

export const registrationRequestSchema = z
  .object({
    fullName: z
      .string({ error: "Nama lengkap wajib diisi." })
      .trim()
      .min(3, "Nama lengkap minimal 3 karakter.")
      .max(160, "Nama lengkap maksimal 160 karakter."),
    email: z
      .string({ error: "Email wajib diisi." })
      .transform(normalizeEmail)
      .pipe(z.email("Masukkan alamat email yang valid.").max(320)),
    phone: z
      .string({ error: "Nomor handphone wajib diisi." })
      .transform(normalizeIndonesianPhone)
      .pipe(
        z
          .string()
          .regex(
            /^\+628[1-9][0-9]{6,11}$/,
            "Masukkan nomor handphone Indonesia yang valid.",
          ),
      ),
    password: z
      .string({ error: "Password wajib diisi." })
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password maksimal 128 karakter.")
      .regex(/[A-Z]/, "Password harus memuat minimal satu huruf kapital.")
      .regex(/[a-z]/, "Password harus memuat minimal satu huruf kecil.")
      .regex(/[0-9]/, "Password harus memuat minimal satu angka."),
    passwordConfirmation: z.string({ error: "Konfirmasi password wajib diisi." }),
    businessName: z
      .string({ error: "Nama usaha wajib diisi." })
      .trim()
      .min(1, "Nama usaha wajib diisi.")
      .max(200, "Nama usaha maksimal 200 karakter."),
    businessType: z.enum(BusinessType, { error: "Pilih jenis usaha yang valid." }),
    businessTypeOther: nullableExplanation,
    commodityId: z.union([
      z.string().trim().min(1, "Komoditas wajib dipilih."),
      z.number().int().positive("Komoditas tidak valid."),
    ]),
    commodityOther: nullableExplanation,
    cityRegency: z
      .string({ error: "Kabupaten atau kota wajib dipilih." })
      .trim()
      .min(1, "Kabupaten atau kota wajib dipilih.")
      .max(160),
    province: z
      .string({ error: "Provinsi wajib diisi." })
      .trim()
      .min(1, "Provinsi wajib diisi.")
      .max(120),
    termsAccepted: z.literal(true, {
      error: "Anda harus menyetujui syarat dan ketentuan.",
    }),
    termsVersion: z.string().trim().min(1, "Versi syarat dan ketentuan wajib tersedia.").max(40),
    privacyVersion: z.string().trim().min(1, "Versi kebijakan privasi wajib tersedia.").max(40),
  })
  .superRefine((data, context) => {
    if (data.password !== data.passwordConfirmation) {
      context.addIssue({
        code: "custom",
        path: ["passwordConfirmation"],
        message: "Konfirmasi password tidak sama.",
      });
    }

    if (data.businessType === BusinessType.OTHER && !data.businessTypeOther) {
      context.addIssue({
        code: "custom",
        path: ["businessTypeOther"],
        message: "Jelaskan jenis usaha lainnya.",
      });
    }
  });
