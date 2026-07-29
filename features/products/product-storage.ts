import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPrivateUploadRoot } from "@/lib/business-documents/document-storage";

function resolveProductImage(storageKey: string): string {
  if (!storageKey || path.isAbsolute(storageKey)) throw new Error("INVALID_STORAGE_KEY");
  const root = getPrivateUploadRoot();
  const target = path.resolve(root, storageKey);
  const relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("INVALID_STORAGE_KEY");
  return target;
}

export async function saveProductImage(businessId: bigint, productId: bigint, bytes: Buffer, extension: string) {
  const fileName = `${randomUUID()}${extension}`;
  const storageKey = path.join("product-images", businessId.toString(), productId.toString(), fileName).replaceAll("\\", "/");
  const target = resolveProductImage(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
  return storageKey;
}

export async function readProductImage(storageKey: string) {
  const target = resolveProductImage(storageKey);
  const [bytes, fileStat] = await Promise.all([readFile(target), stat(target)]);
  if (!fileStat.isFile()) throw new Error("IMAGE_NOT_FOUND");
  return bytes;
}

export async function deleteProductImageFile(storageKey: string): Promise<void> {
  try {
    await unlink(resolveProductImage(storageKey));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

