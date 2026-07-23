import { NextResponse } from "next/server";
import { applicationError, requireUptdHead } from "@/features/testing-applications/testing-application.auth";
import { uptdApprovalSchema } from "@/features/testing-applications/testing-application.schema";
import { decideUptdApproval } from "@/features/testing-applications/testing-application.service";
import { getRequestContext } from "@/lib/request-context";

interface Context { readonly params: Promise<{ readonly id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) throw new Error("NOT_FOUND");
    const user = await requireUptdHead();
    const parsed = uptdApprovalSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: "Keputusan belum valid.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const data = await decideUptdApproval(user.id, id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: parsed.data.decision === "APPROVE" ? "Permohonan disetujui dan pelaku usaha telah diberi notifikasi." : "Permohonan ditolak.", data });
  } catch (error: unknown) {
    const detail = applicationError(error);
    return NextResponse.json({ success: false, message: detail.message, errors: {} }, { status: detail.status });
  }
}
