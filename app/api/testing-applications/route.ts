import { NextResponse } from "next/server";
import { applicant, apiError, validationError } from "@/features/testing-applications/testing-api";
import { applicationListQuerySchema, draftApplicationSchema } from "@/features/testing-applications/testing-application.schema";
import { listApplications, saveDraft } from "@/features/testing-applications/testing-application.service";
import { getRequestContext } from "@/lib/request-context";

export async function GET(request: Request) { try { const { owner } = await applicant("read"); const url = new URL(request.url); const parsed = applicationListQuerySchema.safeParse(Object.fromEntries(url.searchParams)); if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors); const data = await listApplications(owner, parsed.data); return NextResponse.json({ success: true, message: "Daftar permohonan berhasil dimuat.", data }); } catch (error: unknown) { return apiError(error); } }
export async function POST(request: Request) { try { const { owner } = await applicant("create"); const parsed = draftApplicationSchema.safeParse(await request.json()); if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors); const data = await saveDraft(owner, parsed.data, getRequestContext(request)); return NextResponse.json({ success: true, message: "Draft permohonan berhasil disimpan.", data }, { status: 201 }); } catch (error: unknown) { return apiError(error); } }

