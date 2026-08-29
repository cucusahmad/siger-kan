import { NextResponse } from "next/server";

import { aiChatRequestSchema } from "@/features/ai-knowledge/ai-knowledge.schema";
import { AiKnowledgeError, requestAiConsultation } from "@/features/ai-knowledge/ai-knowledge.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const parsed = aiChatRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, message: "Pesan konsultasi tidak valid.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const data = await requestAiConsultation(parsed.data);
    return NextResponse.json({ success: true, message: "Jawaban AI berhasil dibuat.", data });
  } catch (error: unknown) {
    if (error instanceof AiKnowledgeError) return failure(error.message, error.status);
    console.error("AI consultation request failed", { userId: user.id, error });
    return failure("Terjadi gangguan saat menghubungi layanan AI.", 500);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message, errors: {} }, { status });
}
