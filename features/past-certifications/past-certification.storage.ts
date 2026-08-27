import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveBusinessDocumentFile } from "@/lib/business-documents/document-storage";

const allowedFiles = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);

export interface SavedPastCertificationFile {
  readonly name: string;
  readonly storageKey: string;
  readonly mimeType: string;
  readonly size: bigint;
}

export async function savePastCertificationFile(businessId: bigint, file: File): Promise<SavedPastCertificationFile> {
  const extension = allowedFiles.get(file.type);
  if (!extension || file.size <= 0 || file.size > 10 * 1024 * 1024 || path.extname(file.name).toLowerCase() !== extension) {
    throw new Error("INVALID_FILE");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const hasValidSignature = file.type === "application/pdf"
    ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
    : file.type === "image/png"
      ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  if (!hasValidSignature) throw new Error("INVALID_FILE");

  const storageKey = path.join("past-certifications", businessId.toString(), `${randomUUID()}${extension}`).replaceAll("\\", "/");
  const target = resolveBusinessDocumentFile(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
  return { name: path.basename(file.name).slice(0, 255), storageKey, mimeType: file.type, size: BigInt(file.size) };
}

export async function readPastCertificationFile(storageKey: string) {
  const target = resolveBusinessDocumentFile(storageKey);
  const [bytes, details] = await Promise.all([readFile(target), stat(target)]);
  if (!details.isFile()) throw new Error("FILE_UNAVAILABLE");
  return { bytes, size: details.size };
}

export async function removePastCertificationFile(storageKey: string): Promise<void> {
  await unlink(resolveBusinessDocumentFile(storageKey)).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}
