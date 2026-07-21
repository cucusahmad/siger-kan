import { NextResponse } from "next/server";
import { applicant, apiError } from "@/features/testing-applications/testing-api";
import { getTestingParameters } from "@/features/testing-applications/testing-application.service";
export async function GET() { try { await applicant("read"); return NextResponse.json({ success: true, message: "Parameter pengujian berhasil dimuat.", data: await getTestingParameters() }); } catch (error: unknown) { return apiError(error); } }
