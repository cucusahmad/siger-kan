import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi." })
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid.")
    .max(320, "Email terlalu panjang.")
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: "Password wajib diisi." })
    .min(1, "Password wajib diisi.")
    .max(256, "Password terlalu panjang."),
  rememberMe: z.boolean().optional().default(false),
});

export interface LoginInput {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}
