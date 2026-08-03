import { NextResponse } from "next/server";
import { requireCertificationApplicant } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError } from "@/features/certification-applications/certification-api";
import { uploadCertificationDocument } from "@/features/certification-applications/certification-document.service";
interface Context { readonly params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: Context) { try { const { user, businessId } = await requireCertificationApplicant(); const data = await uploadCertificationDocument({ userId: user.id, businessId }, BigInt((await params).id), await request.formData()); return NextResponse.json({ success: true, message: "Dokumen berhasil diunggah.", data }, { status: 201 }); } catch (error: unknown) { return certificationApiError(error); } }
