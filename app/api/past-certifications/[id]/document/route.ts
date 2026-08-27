import { NextResponse } from "next/server";

import { getPastCertificationDocument, getPastCertificationError } from "@/features/past-certifications/past-certification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

interface Context { readonly params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("certification.read")) return failure("Anda tidak memiliki izin melihat dokumen sertifikasi.", 403);
  try {
    const document = await getPastCertificationDocument(user.id, (await params).id);
    const safeName = document.documentName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(document.documentName).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(document.bytes, { headers: {
      "Content-Type": document.documentMimeType, "Content-Length": document.size.toString(),
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error: unknown) {
    const known = getPastCertificationError(error);
    if (known.status === 500) console.error("Past certification document failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) { return NextResponse.json({ success: false, message }, { status }); }
