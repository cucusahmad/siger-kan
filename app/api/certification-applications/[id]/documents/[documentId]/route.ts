import { NextResponse } from "next/server";
import { requireCertificationApplicant, requireCertificationReviewer } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError } from "@/features/certification-applications/certification-api";
import { deleteCertificationDocument, readCertificationDocument } from "@/features/certification-applications/certification-document.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

interface Context { readonly params: Promise<{ id: string; documentId: string }> }

export async function GET(request: Request, { params }: Context) {
  try {
    const { id, documentId } = await params;
    const currentUser = await getCurrentUser();
    let businessId: bigint | undefined;
    if (currentUser?.roleCodes.includes("PETUGAS_SERTIFIKASI")) await requireCertificationReviewer();
    else businessId = (await requireCertificationApplicant()).businessId;
    const document = await readCertificationDocument(BigInt(id), BigInt(documentId), businessId);
    const previewRequested = new URL(request.url).searchParams.get("preview") === "1";
    const disposition = previewRequested && document.mimeType.startsWith("image/") ? "inline" : "attachment";
    return new NextResponse(Uint8Array.from(document.bytes), { headers: { "content-type": document.mimeType, "content-length": document.size.toString(), "content-disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(document.originalFileName)}`, "cache-control": "private, no-store" } });
  } catch (error: unknown) { return certificationApiError(error); }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id, documentId } = await params; const { user, businessId } = await requireCertificationApplicant();
    await deleteCertificationDocument({ userId: user.id, businessId }, BigInt(id), BigInt(documentId));
    return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus." });
  } catch (error: unknown) { return certificationApiError(error); }
}
