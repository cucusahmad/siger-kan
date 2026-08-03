import { NextResponse } from "next/server";

import { consultationActionSchema } from "@/features/e-coaching/e-coaching.schema";
import { getConsultationError, updateConsultation } from "@/features/e-coaching/e-coaching.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";
import { parseConsultationFiles } from "@/features/e-coaching/consultation-attachment-storage";

interface RouteContext {
  readonly params: Promise<{ readonly consultationId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
    const formData = isMultipart ? await request.formData() : null;
    const payload = formData ? { action: formData.get("action"), message: formData.get("message") } : await request.json().catch(() => null);
    const parsed = consultationActionSchema.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Data tindakan tidak valid.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const { consultationId } = await context.params;
    const files = formData ? await parseConsultationFiles(formData) : [];
    const data = await updateConsultation(user, consultationId, parsed.data, files, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Konsultasi berhasil diperbarui.", data });
  } catch (error: unknown) {
    const known = getConsultationError(error);
    if (known.status === 500) console.error("E-coaching update failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
