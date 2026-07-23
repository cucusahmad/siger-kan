import { NextResponse } from "next/server";
import { decideLaboratoryReport } from "@/features/testing-applications/laboratory-report.service";
import { requireReportApprover } from "@/features/testing-applications/testing-application.auth";
import { apiError, validId } from "@/features/testing-applications/testing-api";
import { getRequestContext } from "@/lib/request-context";

interface Context { readonly params: Promise<{ readonly id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!validId(id)) throw new Error("NOT_FOUND");
    const user = await requireReportApprover();
    const data = await decideLaboratoryReport(user.id, id, await request.json(), getRequestContext(request));
    const status = (data as { readonly status: string }).status;
    return NextResponse.json({ success: true, message: status === "MENUNGGU_DOKUMEN_FINAL" ? "LHU disetujui. Penyelia dapat mengunggah dokumen final." : "LHU dikembalikan kepada penyelia untuk diperbaiki.", data });
  } catch (error: unknown) { return apiError(error); }
}
