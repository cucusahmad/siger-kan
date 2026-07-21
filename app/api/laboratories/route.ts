import { NextResponse } from "next/server";
import { applicant, apiError } from "@/features/testing-applications/testing-api";
import { getLaboratories } from "@/features/testing-applications/testing-application.service";
export async function GET() { try { await applicant("read"); return NextResponse.json({ success: true, message: "Laboratorium berhasil dimuat.", data: await getLaboratories() }); } catch (error: unknown) { return apiError(error); } }

