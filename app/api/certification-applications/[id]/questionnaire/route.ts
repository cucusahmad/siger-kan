import { NextResponse } from "next/server";
import { requireCertificationApplicant, requireCertificationReviewer } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError, certificationValidationError } from "@/features/certification-applications/certification-api";
import { certificationQuestionnaireDraftSchema } from "@/features/certification-applications/certification-questionnaire.schema";
import { getCertificationQuestionnaire, saveCertificationQuestionnaire } from "@/features/certification-applications/certification-questionnaire.service";
import { getRequestContext } from "@/lib/request-context";
import { getCurrentUser } from "@/lib/business/get-current-business";

interface Context { readonly params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) { try { const id = BigInt((await params).id); const currentUser = await getCurrentUser(); if (currentUser?.roleCodes.includes("PETUGAS_SERTIFIKASI")) { await requireCertificationReviewer(); return NextResponse.json({ success: true, message: "Kuesioner berhasil dimuat.", data: await getCertificationQuestionnaire(id) }); } const { user, businessId } = await requireCertificationApplicant(); return NextResponse.json({ success: true, message: "Kuesioner berhasil dimuat.", data: await getCertificationQuestionnaire(id, { userId: user.id, businessId }) }); } catch (error: unknown) { return certificationApiError(error); } }
export async function PUT(request: Request, { params }: Context) { try { const { user, businessId } = await requireCertificationApplicant(); const body = await request.json() as { submit?: boolean; data?: unknown }; const parsed = certificationQuestionnaireDraftSchema.safeParse(body.data); if (!parsed.success) return certificationValidationError(parsed.error.flatten().fieldErrors); await saveCertificationQuestionnaire({ userId: user.id, businessId }, BigInt((await params).id), parsed.data, getRequestContext(request), body.submit === true); return NextResponse.json({ success: true, message: body.submit ? "Permohonan dan kuesioner berhasil diajukan." : "Draft kuesioner berhasil disimpan.", data: {} }); } catch (error: unknown) { return certificationApiError(error); } }
