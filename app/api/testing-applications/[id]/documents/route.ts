import { NextResponse } from "next/server";
import { applicant, apiError, validId } from "@/features/testing-applications/testing-api";
import { uploadApplicationDocument } from "@/features/testing-applications/testing-document.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ readonly id: string }> }
export async function POST(request: Request, context: Context) { try { const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND"); const { user } = await applicant("update"); const data = await uploadApplicationDocument(user.id, id, await request.formData(), getRequestContext(request)); return NextResponse.json({ success: true, message: "Dokumen berhasil diunggah.", data }, { status: 201 }); } catch (error: unknown) { return apiError(error); } }

