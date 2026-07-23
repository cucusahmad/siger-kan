import { NextResponse } from "next/server";
import { applicant, apiError, validId } from "@/features/testing-applications/testing-api";
import { requireSampleReceptionOfficer } from "@/features/testing-applications/testing-application.auth";
import { deleteApplicationDocument, serveApplicationDocumentForReception } from "@/features/testing-applications/testing-document.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ readonly id: string; readonly documentId: string }> }
export const runtime = "nodejs";
export async function GET(_request: Request, context: Context) { try { const { id, documentId } = await context.params; if (!validId(id) || !validId(documentId)) throw new Error("NOT_FOUND"); await requireSampleReceptionOfficer(); return await serveApplicationDocumentForReception(id, documentId); } catch (error: unknown) { return apiError(error); } }
export async function DELETE(request: Request, context: Context) { try { const { id, documentId } = await context.params; if (!validId(id) || !validId(documentId)) throw new Error("NOT_FOUND"); const { user } = await applicant("update"); await deleteApplicationDocument(user.id, id, documentId, getRequestContext(request)); return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus.", data: {} }); } catch (error: unknown) { return apiError(error); } }
