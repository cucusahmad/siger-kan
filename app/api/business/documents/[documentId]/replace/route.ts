import { NextResponse } from "next/server";

import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { documentRequestError, parseDocumentFormData } from "@/lib/business-documents/document-request";
import { replaceBusinessDocument } from "@/lib/business-documents/document-service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

interface RouteContext { readonly params: Promise<{ readonly documentId: string }>; }

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.document.upload")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengganti dokumen usaha." }, { status: 403 });
  const { documentId } = await context.params;
  try {
    const input = await parseDocumentFormData(request);
    const data = await replaceBusinessDocument(user.id, documentId, input, getRequestContext(request), isAdminDinas(user));
    return NextResponse.json({ success: true, message: "File dokumen berhasil diganti.", data });
  } catch (error: unknown) {
    const known = documentRequestError(error);
    if (known) return NextResponse.json({ success: false, message: known.message, ...(known.errors ? { errors: known.errors } : {}) }, { status: known.status });
    console.error("Business document replacement failed", { userId: user.id, documentId, error });
    return NextResponse.json({ success: false, message: "Dokumen gagal disimpan. Silakan coba kembali." }, { status: 500 });
  }
}
