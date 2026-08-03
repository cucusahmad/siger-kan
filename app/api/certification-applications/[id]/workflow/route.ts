import { NextResponse } from "next/server";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";
import { certificationApiError, certificationValidationError } from "@/features/certification-applications/certification-api";
import { requireCertificationApplicant, requireCertificationReviewer } from "@/features/certification-applications/certification-application.auth";
import { certificationWorkflowSchema } from "@/features/certification-applications/certification-application.schema";
import { processCertificationWorkflow } from "@/features/certification-applications/certification-application.service";

interface Context { readonly params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const parsed = certificationWorkflowSchema.safeParse(await request.json());
    if (!parsed.success) return certificationValidationError(parsed.error.flatten().fieldErrors);
    const currentUser = await getCurrentUser();
    const isReviewer = currentUser?.roleCodes.includes("PETUGAS_SERTIFIKASI") ?? false;
    let userId: string; let businessId: bigint | undefined;
    if (isReviewer) userId = (await requireCertificationReviewer()).id;
    else { const applicant = await requireCertificationApplicant(); userId = applicant.user.id; businessId = applicant.businessId; await resolveCurrentBusiness(userId); }
    await processCertificationWorkflow(userId, BigInt((await params).id), parsed.data, isReviewer, businessId, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Tahapan sertifikasi berhasil diperbarui.", data: {} });
  } catch (error: unknown) { return certificationApiError(error); }
}
