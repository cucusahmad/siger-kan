import { extname } from "node:path";
import { z } from "zod";

import { MAX_BUSINESS_DOCUMENT_SIZE_BYTES } from "./document-constants";
import { isBusinessDocumentType } from "./document-types";

const acceptedFiles = {
  ".pdf": { mimeType: "application/pdf", signature: [0x25, 0x50, 0x44, 0x46] },
  ".jpg": { mimeType: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  ".jpeg": { mimeType: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  ".png": { mimeType: "image/png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
} as const;

export const documentMetadataSchema = z.object({
  documentType: z.string().refine(isBusinessDocumentType, "Jenis dokumen tidak valid."),
  customTitle: z.string().trim().max(200, "Judul dokumen maksimal 200 karakter.").optional().default(""),
  documentNumber: z.string().trim().max(120, "Nomor dokumen maksimal 120 karakter.").optional().default(""),
  issuedAt: z.string().trim().optional().default("").refine(isDateOnly, "Tanggal terbit tidak valid."),
  expiresAt: z.string().trim().optional().default("").refine(isDateOnly, "Tanggal berlaku tidak valid."),
}).superRefine((value, context) => {
  if (value.documentType === "OTHER" && !value.customTitle) context.addIssue({ code: "custom", path: ["customTitle"], message: "Judul dokumen wajib diisi untuk Dokumen Lainnya." });
  if (value.issuedAt && value.issuedAt > todayDateOnly()) context.addIssue({ code: "custom", path: ["issuedAt"], message: "Tanggal terbit tidak boleh di masa depan." });
  if (value.issuedAt && value.expiresAt && value.expiresAt < value.issuedAt) context.addIssue({ code: "custom", path: ["expiresAt"], message: "Tanggal berlaku tidak boleh lebih awal dari tanggal terbit." });
});

function todayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateOnly(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function dateOnlyToDate(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function sanitizeOriginalFileName(value: string): string {
  const baseName = value.replaceAll("\\", "/").split("/").at(-1) ?? "dokumen";
  const normalized = baseName.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "_").replace(/\s+/g, " ").trim();
  return (normalized || "dokumen").slice(0, 255);
}

export function validateDocumentFile(file: File, bytes: Uint8Array): { readonly extension: keyof typeof acceptedFiles; readonly mimeType: string } {
  if (file.size === 0 || bytes.length === 0) throw new Error("EMPTY_FILE");
  if (file.size > MAX_BUSINESS_DOCUMENT_SIZE_BYTES || bytes.length > MAX_BUSINESS_DOCUMENT_SIZE_BYTES) throw new Error("FILE_TOO_LARGE");
  const sanitizedName = sanitizeOriginalFileName(file.name);
  const extension = extname(sanitizedName).toLowerCase() as keyof typeof acceptedFiles;
  const definition = acceptedFiles[extension];
  if (!definition) throw new Error("UNSUPPORTED_FILE");
  if (file.type !== definition.mimeType) throw new Error("UNSUPPORTED_FILE");
  if (!definition.signature.every((value, index) => bytes[index] === value)) throw new Error("INVALID_SIGNATURE");
  return { extension, mimeType: definition.mimeType };
}

export function documentValidationMessage(code: string): string {
  const messages: Readonly<Record<string, string>> = {
    EMPTY_FILE: "File tidak boleh kosong.",
    FILE_TOO_LARGE: "Ukuran file maksimal 5 MB.",
    UNSUPPORTED_FILE: "Format file harus PDF, JPG, atau PNG.",
    INVALID_SIGNATURE: "Isi file tidak sesuai dengan format file.",
  };
  return messages[code] ?? "Dokumen gagal disimpan. Silakan coba kembali.";
}
