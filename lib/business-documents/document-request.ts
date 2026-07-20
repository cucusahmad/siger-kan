import { documentMetadataSchema, documentValidationMessage, validateDocumentFile } from "./document-validation";

export async function parseDocumentFormData(request: Request) {
  let formData: FormData;
  try { formData = await request.formData(); } catch { throw new Error("INVALID_FORM_DATA"); }
  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) throw new Error("EMPTY_FILE");
  const parsed = documentMetadataSchema.safeParse({
    documentType: stringValue(formData, "documentType"), customTitle: stringValue(formData, "customTitle"),
    documentNumber: stringValue(formData, "documentNumber"), issuedAt: stringValue(formData, "issuedAt"), expiresAt: stringValue(formData, "expiresAt"),
  });
  if (!parsed.success) {
    const error = new Error("INVALID_METADATA") as Error & { fieldErrors?: Readonly<Record<string, readonly string[]>> };
    error.fieldErrors = parsed.error.flatten().fieldErrors;
    throw error;
  }
  const buffer = Buffer.from(await fileValue.arrayBuffer());
  const validated = validateDocumentFile(fileValue, buffer);
  return {
    ...parsed.data,
    documentType: parsed.data.documentType,
    originalFileName: fileValue.name,
    fileSizeBytes: buffer.length,
    buffer,
    ...validated,
  };
}

function stringValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function documentRequestError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (["EMPTY_FILE", "FILE_TOO_LARGE", "UNSUPPORTED_FILE", "INVALID_SIGNATURE"].includes(code)) return { status: 422, message: documentValidationMessage(code) };
  if (code === "INVALID_FORM_DATA") return { status: 400, message: "Data unggahan tidak valid." };
  if (code === "INVALID_METADATA") return { status: 422, message: "Periksa kembali data dokumen.", errors: (error as Error & { fieldErrors?: Readonly<Record<string, readonly string[]>> }).fieldErrors };
  if (code === "DUPLICATE_DOCUMENT") return { status: 409, message: "Dokumen jenis ini sudah tersedia. Gunakan fitur Ganti File." };
  if (code === "DOCUMENT_NOT_FOUND") return { status: 404, message: "Dokumen tidak ditemukan." };
  if (code === "BUSINESS_NOT_FOUND") return { status: 404, message: "Tidak ada usaha yang terhubung dengan akun Anda." };
  if (code === "FORBIDDEN") return { status: 403, message: "Anda tidak memiliki akses ke dokumen ini." };
  if (code === "STORAGE_UNAVAILABLE") return { status: 500, message: "Folder penyimpanan dokumen tidak dapat digunakan." };
  if (code === "FILE_UNAVAILABLE") return { status: 404, message: "Data dokumen tersedia, tetapi file tidak ditemukan." };
  if (code === "INVALID_STORAGE_KEY") return { status: 404, message: "File dokumen tidak tersedia." };
  return null;
}
