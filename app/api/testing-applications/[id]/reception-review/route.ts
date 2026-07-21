import { NextResponse } from "next/server";

import { applicationError, requireSampleReceptionOfficer } from "@/features/testing-applications/testing-application.auth";
import { receptionReviewSchema } from "@/features/testing-applications/testing-application.schema";
import { reviewReceptionApplication } from "@/features/testing-applications/testing-application.service";
import { getRequestContext } from "@/lib/request-context";

interface Context { readonly params: Promise<{ readonly id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) throw new Error("NOT_FOUND");
    const user = await requireSampleReceptionOfficer();
    const parsed = receptionReviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: "Data verifikasi belum valid.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const data = await reviewReceptionApplication(user.id, id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: parsed.data.decision === "APPROVE" ? "Permohonan berhasil disetujui." : "Permohonan dikembalikan untuk diperbaiki.", data });
  } catch (error: unknown) {
    const detail = applicationError(error);
    return NextResponse.json({ success: false, message: detail.message, errors: {} }, { status: detail.status });
  }
}
