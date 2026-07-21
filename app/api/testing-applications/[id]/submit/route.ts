import { NextResponse } from "next/server";
import { applicant, apiError, validId, validationError } from "@/features/testing-applications/testing-api";
import { submitApplicationSchema } from "@/features/testing-applications/testing-application.schema";
import { submitApplication } from "@/features/testing-applications/testing-application.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ readonly id: string }> }
export async function POST(request: Request, context: Context) { try { const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND"); const { owner } = await applicant("update"); const parsed = submitApplicationSchema.safeParse(await request.json()); if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors); return NextResponse.json({ success: true, message: "Permohonan berhasil diajukan.", data: await submitApplication(owner, id, parsed.data, getRequestContext(request)) }); } catch (error: unknown) { return apiError(error); } }

