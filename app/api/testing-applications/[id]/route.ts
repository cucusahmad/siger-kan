import { NextResponse } from "next/server";
import { applicant, apiError, validId, validationError } from "@/features/testing-applications/testing-api";
import { draftApplicationSchema } from "@/features/testing-applications/testing-application.schema";
import { deleteApplication, getApplication, saveDraft } from "@/features/testing-applications/testing-application.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ readonly id: string }> }
export async function GET(_request: Request, context: Context) { try { const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND"); const { owner } = await applicant("read"); return NextResponse.json({ success: true, message: "Detail permohonan berhasil dimuat.", data: await getApplication(owner, id) }); } catch (error: unknown) { return apiError(error); } }
export async function PUT(request: Request, context: Context) { try { const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND"); const { owner } = await applicant("update"); const parsed = draftApplicationSchema.safeParse(await request.json()); if (!parsed.success) return validationError(parsed.error.flatten().fieldErrors); return NextResponse.json({ success: true, message: "Draft permohonan berhasil disimpan.", data: await saveDraft(owner, parsed.data, getRequestContext(request), id) }); } catch (error: unknown) { return apiError(error); } }
export async function DELETE(request: Request, context: Context) { try { const { id } = await context.params; if (!validId(id)) throw new Error("NOT_FOUND"); const { owner } = await applicant("update"); await deleteApplication(owner, id, getRequestContext(request)); return NextResponse.json({ success: true, message: "Draft permohonan berhasil dihapus.", data: {} }); } catch (error: unknown) { return apiError(error); } }

