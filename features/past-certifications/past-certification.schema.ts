import { z } from "zod";

export const pastCertificationStatuses = ["BERLAKU", "KEDALUWARSA", "DICABUT", "LAINNYA"] as const;

export const pastCertificationSchema = z.object({
  productName: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(200),
  sniNumber: z.string().trim().max(100),
  spptSniNumber: z.string().trim().max(120),
  skpNumber: z.string().trim().max(160),
  spptIssuedAt: z.union([z.literal(""), z.iso.date()]),
  spptExpiresAt: z.union([z.literal(""), z.iso.date()]),
  certificationStatus: z.enum(pastCertificationStatuses),
  notes: z.string().trim().max(5000),
}).superRefine((value, context) => {
  if (value.spptIssuedAt && value.spptExpiresAt && value.spptExpiresAt < value.spptIssuedAt) {
    context.addIssue({ code: "custom", path: ["spptExpiresAt"], message: "Tanggal berakhir tidak boleh mendahului tanggal terbit." });
  }
  if (!value.sniNumber && !value.spptSniNumber && !value.skpNumber) {
    context.addIssue({ code: "custom", path: ["sniNumber"], message: "Isi minimal salah satu nomor SNI, SPPT SNI, atau SKP." });
  }
});

export interface PastCertificationView {
  readonly id: string;
  readonly productName: string;
  readonly sniNumber: string;
  readonly spptSniNumber: string;
  readonly skpNumber: string;
  readonly spptIssuedAt: string;
  readonly spptExpiresAt: string;
  readonly certificationStatus: typeof pastCertificationStatuses[number];
  readonly notes: string;
  readonly documentName: string | null;
  readonly documentSize: string | null;
  readonly createdAt: string;
}

export type PastCertificationInput = z.infer<typeof pastCertificationSchema>;
