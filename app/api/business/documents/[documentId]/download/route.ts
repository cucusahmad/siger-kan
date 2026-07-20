import { NextResponse } from "next/server";

import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { serveBusinessDocument } from "@/lib/business-documents/document-response";
import { documentRequestError } from "@/lib/business-documents/document-request";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const runtime = "nodejs";
interface RouteContext { readonly params: Promise<{ readonly documentId: string }>; }

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.document.read")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengunduh dokumen usaha." }, { status: 403 });
  const { documentId } = await context.params;
  try { return await serveBusinessDocument(user.id, documentId, "attachment", isAdminDinas(user)); }
  catch (error: unknown) {
    const known = documentRequestError(error);
    return NextResponse.json({ success: false, message: known?.message ?? "Dokumen tidak dapat diunduh." }, { status: known?.status ?? 500 });
  }
}
