import { NextResponse } from "next/server";

import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { deleteBusinessDocument } from "@/lib/business-documents/document-service";
import { documentRequestError } from "@/lib/business-documents/document-request";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

interface RouteContext { readonly params: Promise<{ readonly documentId: string }>; }

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.document.upload")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk menghapus dokumen usaha." }, { status: 403 });
  const { documentId } = await context.params;
  try {
    await deleteBusinessDocument(user.id, documentId, getRequestContext(request), isAdminDinas(user));
    return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus.", data: null });
  } catch (error: unknown) {
    const known = documentRequestError(error);
    if (known) return NextResponse.json({ success: false, message: known.message }, { status: known.status });
    console.error("Business document delete failed", { userId: user.id, documentId, error });
    return NextResponse.json({ success: false, message: "Dokumen gagal dihapus. Silakan coba kembali." }, { status: 500 });
  }
}
