import { NextResponse } from "next/server";
import { requireCertificationReviewer } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError, certificationValidationError } from "@/features/certification-applications/certification-api";
import { certificationReviewSchema } from "@/features/certification-applications/certification-application.schema";
import { reviewCertificationApplication } from "@/features/certification-applications/certification-application.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: Context) { try { const user = await requireCertificationReviewer(); const parsed = certificationReviewSchema.safeParse(await request.json()); if (!parsed.success) return certificationValidationError(parsed.error.flatten().fieldErrors); await reviewCertificationApplication(user.id, BigInt((await params).id), parsed.data, getRequestContext(request)); return NextResponse.json({ success: true, message: parsed.data.decision === "VERIFIED" ? "Permohonan dinyatakan lengkap dan sesuai." : "Permohonan dikembalikan untuk diperbaiki." }); } catch (error: unknown) { return certificationApiError(error); } }
