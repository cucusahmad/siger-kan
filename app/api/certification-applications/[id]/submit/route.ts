import { NextResponse } from "next/server";
import { requireCertificationApplicant } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError } from "@/features/certification-applications/certification-api";
import { submitCertificationApplication } from "@/features/certification-applications/certification-application.service";
import { getRequestContext } from "@/lib/request-context";
interface Context { readonly params: Promise<{ id: string }> }
export async function POST(request: Request, { params }: Context) { try { const { user, businessId } = await requireCertificationApplicant(); await submitCertificationApplication({ userId: user.id, businessId }, BigInt((await params).id), getRequestContext(request)); return NextResponse.json({ success: true, message: "Permohonan berhasil diajukan." }); } catch (error: unknown) { return certificationApiError(error); } }
