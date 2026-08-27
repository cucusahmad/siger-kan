import { NextResponse } from "next/server";

import { pastCertificationSchema } from "@/features/past-certifications/past-certification.schema";
import { deletePastCertification, getPastCertificationError, updatePastCertification } from "@/features/past-certifications/past-certification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.roleCodes.includes("PELAKU_USAHA") || !user.permissions.includes("certification.create")) {
    return failure("Anda tidak memiliki izin mengubah sertifikasi.", 403);
  }
  try {
    const { id } = await context.params;
    const form = await request.formData();
    const parsed = pastCertificationSchema.safeParse(readFields(form));
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data sertifikasi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const rawFile = form.get("document");
    const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
    const data = await updatePastCertification(user.id, id, parsed.data, file, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Sertifikasi lampau berhasil diperbarui.", data });
  } catch (error: unknown) {
    return handleError(error, user.id, "update");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.roleCodes.includes("PELAKU_USAHA") || !user.permissions.includes("certification.create")) {
    return failure("Anda tidak memiliki izin menghapus sertifikasi.", 403);
  }
  try {
    const { id } = await context.params;
    await deletePastCertification(user.id, id, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Sertifikasi lampau berhasil dihapus.", data: null });
  } catch (error: unknown) {
    return handleError(error, user.id, "delete");
  }
}

function readFields(form: FormData) {
  return {
    productName: form.get("productName"), sniNumber: form.get("sniNumber"), spptSniNumber: form.get("spptSniNumber"),
    skpNumber: form.get("skpNumber"), spptIssuedAt: form.get("spptIssuedAt"), spptExpiresAt: form.get("spptExpiresAt"),
    certificationStatus: form.get("certificationStatus"), notes: form.get("notes"),
  };
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function handleError(error: unknown, userId: string, operation: string) {
  const known = getPastCertificationError(error);
  if (known.status === 500) console.error("Past certification request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
