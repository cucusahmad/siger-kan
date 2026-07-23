import { NextResponse } from "next/server";
import { reviewAcceptedSample } from "@/features/testing-applications/sample-review.service";
import { requireSampleReceptionOfficer } from "@/features/testing-applications/testing-application.auth";
import { apiError, validId } from "@/features/testing-applications/testing-api";
import { getRequestContext } from "@/lib/request-context";

interface Context { readonly params: Promise<{ readonly id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!validId(id)) throw new Error("NOT_FOUND");
    const user = await requireSampleReceptionOfficer();
    const data = await reviewAcceptedSample(user.id, id, await request.json(), getRequestContext(request));
    return NextResponse.json({ success: true, message: "Kaji ulang sampel berhasil disimpan.", data });
  } catch (error: unknown) {
    return apiError(error);
  }
}
