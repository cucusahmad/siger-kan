import { NextResponse } from "next/server";
import { downloadFinalLaboratoryReport, publishFinalLaboratoryReport } from "@/features/testing-applications/final-laboratory-report.service";
import { requireReportPreparer } from "@/features/testing-applications/testing-application.auth";
import { apiError, validId } from "@/features/testing-applications/testing-api";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface Context { readonly params: Promise<{ readonly id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND");
    const user = await requireReportPreparer();
    const data = await publishFinalLaboratoryReport(user.id, id, await request.formData(), getRequestContext(request));
    return NextResponse.json({ success: true, message: "Dokumen final LHU berhasil diterbitkan.", data });
  } catch (error: unknown) { return apiError(error); }
}

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND");
    const user = await getCurrentUser(); if (!user) throw new Error("UNAUTHENTICATED");
    return await downloadFinalLaboratoryReport(user.id, id);
  } catch (error: unknown) { return apiError(error); }
}
