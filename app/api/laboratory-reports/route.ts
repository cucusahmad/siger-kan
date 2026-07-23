import { NextResponse } from "next/server";
import { submitLaboratoryReport } from "@/features/testing-applications/laboratory-report.service";
import { requireReportPreparer } from "@/features/testing-applications/testing-application.auth";
import { apiError } from "@/features/testing-applications/testing-api";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request) {
  try {
    const user = await requireReportPreparer();
    const data = await submitLaboratoryReport(user.id, await request.json(), getRequestContext(request));
    return NextResponse.json({ success: true, message: "LHU berhasil diajukan kepada Kepala UPTD.", data });
  } catch (error: unknown) { return apiError(error); }
}
