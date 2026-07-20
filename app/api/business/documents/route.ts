import { NextResponse } from "next/server";

import { createBusinessDocument, listBusinessDocuments } from "@/lib/business-documents/document-service";
import { documentRequestError, parseDocumentFormData } from "@/lib/business-documents/document-request";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return response("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.document.read")) return response("Anda tidak memiliki izin untuk melihat dokumen usaha.", 403);
  try {
    const canManage = user.permissions.includes("business.document.upload");
    const data = await listBusinessDocuments(user.id, canManage);
    return NextResponse.json({ success: true, message: "Dokumen usaha berhasil dimuat.", data });
  } catch (error: unknown) { return handleError(error, user.id, "list"); }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return response("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.document.upload")) return response("Anda tidak memiliki izin untuk mengunggah dokumen usaha.", 403);
  try {
    const input = await parseDocumentFormData(request);
    const data = await createBusinessDocument(user.id, input, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Dokumen berhasil diunggah.", data }, { status: 201 });
  } catch (error: unknown) { return handleError(error, user.id, "upload"); }
}

function response(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown, userId: string, operation: string) {
  const known = documentRequestError(error);
  if (known) return NextResponse.json({ success: false, message: known.message, ...(known.errors ? { errors: known.errors } : {}) }, { status: known.status });
  console.error("Business document request failed", { userId, operation, error });
  return response("Dokumen gagal disimpan. Silakan coba kembali.", 500);
}
