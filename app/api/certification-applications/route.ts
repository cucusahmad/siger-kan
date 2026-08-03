import { NextResponse } from "next/server";
import { requireCertificationApplicant, requireCertificationReviewer } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError, certificationValidationError } from "@/features/certification-applications/certification-api";
import { certificationDraftSchema } from "@/features/certification-applications/certification-application.schema";
import { listCertificationApplications, saveCertificationDraft } from "@/features/certification-applications/certification-application.service";
import { getRequestContext } from "@/lib/request-context";
import { getCurrentUser } from "@/lib/business/get-current-business";

export async function GET() { try { const currentUser = await getCurrentUser(); if (currentUser?.roleCodes.includes("PETUGAS_SERTIFIKASI")) { await requireCertificationReviewer(); return NextResponse.json({ success: true, message: "Daftar permohonan berhasil dimuat.", data: await listCertificationApplications() }); } const applicant = await requireCertificationApplicant(); const data = await listCertificationApplications({ userId: applicant.user.id, businessId: applicant.businessId }); return NextResponse.json({ success: true, message: "Daftar permohonan berhasil dimuat.", data }); } catch (error: unknown) { return certificationApiError(error); } }
export async function POST(request: Request) { try { const { user, businessId } = await requireCertificationApplicant(); const parsed = certificationDraftSchema.safeParse(await request.json()); if (!parsed.success) return certificationValidationError(parsed.error.flatten().fieldErrors); const id = await saveCertificationDraft({ userId: user.id, businessId }, parsed.data, getRequestContext(request)); return NextResponse.json({ success: true, message: "Draft berhasil disimpan.", data: { id: id.toString() } }, { status: 201 }); } catch (error: unknown) { return certificationApiError(error); } }
