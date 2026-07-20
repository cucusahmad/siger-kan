import { getAccessibleDocument } from "./document-service";
import { readBusinessDocumentFile } from "./document-storage";
import { sanitizeOriginalFileName } from "./document-validation";

export async function serveBusinessDocument(userId: string, documentId: string, disposition: "inline" | "attachment", allowAllBusinesses = false) {
  const document = await getAccessibleDocument(userId, documentId, allowAllBusinesses);
  let stored;
  try { stored = await readBusinessDocumentFile(document.storageKey); } catch (error: unknown) {
    console.error("Business document file is unavailable", { documentId, error });
    throw new Error("FILE_UNAVAILABLE", { cause: error });
  }
  const fileName = sanitizeOriginalFileName(document.originalFileName);
  const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encodedName = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(Uint8Array.from(stored.bytes), { headers: {
    "Content-Type": document.mimeType, "Content-Length": stored.size.toString(),
    "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store, max-age=0",
  } });
}
