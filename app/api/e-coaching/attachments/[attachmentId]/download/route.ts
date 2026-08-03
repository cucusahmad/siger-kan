import { NextResponse } from "next/server";

import { getConsultationAttachment, getConsultationError } from "@/features/e-coaching/e-coaching.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

interface RouteContext {
  readonly params: Promise<{ readonly attachmentId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  try {
    const { attachmentId } = await context.params;
    const file = await getConsultationAttachment(user, attachmentId);
    const encodedName = encodeURIComponent(file.fileName);
    return new Response(Uint8Array.from(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="lampiran"; filename*=UTF-8''${encodedName}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    const known = getConsultationError(error);
    return NextResponse.json({ success: false, message: known.message }, { status: known.status });
  }
}
