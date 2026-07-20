import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SavedBusinessDocumentFile {
  readonly storedFileName: string;
  readonly relativeStorageKey: string;
  readonly fileSizeBytes: number;
  readonly checksum: string;
}

export interface StoredBusinessDocumentFile {
  readonly bytes: Buffer;
  readonly size: number;
}

export function getPrivateUploadRoot(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PRIVATE_UPLOAD_DIR?.trim() || "storage/private",
  );
}

function assertInsideRoot(root: string, target: string): void {
  const difference = path.relative(root, target);
  if (
    difference === ".."
    || difference.startsWith(`..${path.sep}`)
    || path.isAbsolute(difference)
  ) {
    throw new Error("INVALID_STORAGE_KEY");
  }
}

export function resolveBusinessDocumentFile(relativeStorageKey: string): string {
  if (!relativeStorageKey || path.isAbsolute(relativeStorageKey)) {
    throw new Error("INVALID_STORAGE_KEY");
  }

  const root = getPrivateUploadRoot();
  const target = path.resolve(root, relativeStorageKey);
  assertInsideRoot(root, target);
  return target;
}

export async function saveBusinessDocumentFile(
  businessId: bigint,
  buffer: Buffer,
  extension: string,
): Promise<SavedBusinessDocumentFile> {
  const storageRoot = getPrivateUploadRoot();
  const storedFileName = `${randomUUID()}${extension}`;
  const relativeStorageKey = path
    .join("business-documents", businessId.toString(), storedFileName)
    .replaceAll("\\", "/");
  const targetFile = resolveBusinessDocumentFile(relativeStorageKey);
  const targetDirectory = path.dirname(targetFile);

  console.info("Preparing business document storage", {
    privateUploadDirConfigured: Boolean(process.env.PRIVATE_UPLOAD_DIR?.trim()),
    storageRoot,
    targetDirectory,
    businessId: businessId.toString(),
    storedFileName,
  });

  try {
    await mkdir(targetDirectory, { recursive: true });
    await writeFile(targetFile, buffer, { flag: "wx" });
  } catch (error: unknown) {
    console.error("Business document physical write failed", {
      businessId: businessId.toString(),
      storedFileName,
      message: error instanceof Error ? error.message : "Unknown storage error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error("STORAGE_UNAVAILABLE", { cause: error });
  }

  console.info("Business document file written", {
    businessId: businessId.toString(),
    storedFileName,
    fileSizeBytes: buffer.length,
  });

  return {
    storedFileName,
    relativeStorageKey,
    fileSizeBytes: buffer.length,
    checksum: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function readBusinessDocumentFile(
  relativeStorageKey: string,
): Promise<StoredBusinessDocumentFile> {
  const target = resolveBusinessDocumentFile(relativeStorageKey);
  const [bytes, fileStat] = await Promise.all([readFile(target), stat(target)]);
  if (!fileStat.isFile()) throw new Error("FILE_UNAVAILABLE");
  return { bytes, size: fileStat.size };
}

export async function businessDocumentFileExists(relativeStorageKey: string): Promise<boolean> {
  try {
    const fileStat = await stat(resolveBusinessDocumentFile(relativeStorageKey));
    return fileStat.isFile();
  } catch {
    return false;
  }
}

export async function deleteBusinessDocumentFile(relativeStorageKey: string): Promise<void> {
  try {
    await unlink(resolveBusinessDocumentFile(relativeStorageKey));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
