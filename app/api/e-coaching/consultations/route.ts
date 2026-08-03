import { NextResponse } from "next/server";

import { createConsultationSchema } from "@/features/e-coaching/e-coaching.schema";
import { createConsultation, getConsultationError, getConsultations } from "@/features/e-coaching/e-coaching.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";
import { parseConsultationFiles } from "@/features/e-coaching/consultation-attachment-storage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    return NextResponse.json({ success: true, message: "Konsultasi berhasil dimuat.", data: await getConsultations(user) });
  } catch (error: unknown) {
    return consultationFailure(error, user.id, "list");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const formData = await request.formData();
    const parsed = createConsultationSchema.safeParse({ subject: formData.get("subject"), category: formData.get("category"), question: formData.get("question") });
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali pertanyaan Anda.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const data = await createConsultation(user, parsed.data, await parseConsultationFiles(formData), getRequestContext(request));
    return NextResponse.json({ success: true, message: "Pertanyaan berhasil dikirim.", data }, { status: 201 });
  } catch (error: unknown) {
    return consultationFailure(error, user.id, "create");
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function consultationFailure(error: unknown, userId: string, operation: string) {
  const known = getConsultationError(error);
  if (known.status === 500) console.error("E-coaching request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
