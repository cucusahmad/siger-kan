import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(128, "Password maksimal 128 karakter.")
  .regex(/[a-z]/, "Password harus memuat huruf kecil.")
  .regex(/[A-Z]/, "Password harus memuat huruf besar.")
  .regex(/[0-9]/, "Password harus memuat angka.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Password baru harus berbeda dari password saat ini.",
    path: ["newPassword"],
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
