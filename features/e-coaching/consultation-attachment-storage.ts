import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPrivateUploadRoot } from "@/lib/business-documents/document-storage";

const maximumFileSize = 10 * 1024 * 1024;
const allowedFiles = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

export interface ConsultationFileInput {
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly bytes: Uint8Array;
  readonly extension: string;
}

function resolveStorageKey(storageKey: string): string {
  if (!storageKey || path.isAbsolute(storageKey)) throw new Error("INVALID_FILE");
  const root = getPrivateUploadRoot();
  const target = path.resolve(root, storageKey);
  const difference = path.relative(root, target);
  if (difference === ".." || difference.startsWith(`..${path.sep}`) || path.isAbsolute(difference)) throw new Error("INVALID_FILE");
  return target;
}

function hasValidSignature(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (mimeType === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export async function parseConsultationFiles(formData: FormData): Promise<readonly ConsultationFileInput[]> {
  const entries = formData.getAll("files");
  if (entries.length > 3) throw new Error("TOO_MANY_FILES");
  return Promise.all(entries.map(async (entry) => {
    if (!(entry instanceof File) || entry.size <= 0 || entry.size > maximumFileSize) throw new Error("INVALID_FILE");
    const expectedExtension = allowedFiles.get(entry.type);
    const actualExtension = path.extname(entry.name).toLowerCase();
    const isJpegExtension = entry.type === "image/jpeg" && (actualExtension === ".jpg" || actualExtension === ".jpeg");
    if (!expectedExtension || (!isJpegExtension && actualExtension !== expectedExtension)) throw new Error("INVALID_FILE");
    const bytes = new Uint8Array(await entry.arrayBuffer());
    if (!hasValidSignature(entry.type, bytes)) throw new Error("INVALID_FILE");
    return { originalName: path.basename(entry.name).slice(0, 255), mimeType: entry.type, size: entry.size, bytes, extension: isJpegExtension ? actualExtension : expectedExtension };
  }));
}

export async function saveConsultationFile(consultationId: bigint, file: ConsultationFileInput): Promise<string> {
  const storageKey = path.join("consultation-attachments", consultationId.toString(), `${randomUUID()}${file.extension}`).replaceAll("\\", "/");
  const target = resolveStorageKey(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, file.bytes, { flag: "wx" });
  return storageKey;
}

export async function readConsultationFile(storageKey: string): Promise<Buffer> {
  const target = resolveStorageKey(storageKey);
  const [bytes, fileStat] = await Promise.all([readFile(target), stat(target)]);
  if (!fileStat.isFile()) throw new Error("FILE_UNAVAILABLE");
  return bytes;
}

export async function deleteConsultationFile(storageKey: string): Promise<void> {
  await unlink(resolveStorageKey(storageKey)).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}
