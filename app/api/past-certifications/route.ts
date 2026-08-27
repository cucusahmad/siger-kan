import { NextResponse } from "next/server";

import { pastCertificationSchema } from "@/features/past-certifications/past-certification.schema";
import { createPastCertification, getPastCertificationError, listPastCertifications } from "@/features/past-certifications/past-certification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("certification.read")) return failure("Anda tidak memiliki izin melihat sertifikasi.", 403);
  try {
    return NextResponse.json({ success: true, message: "Sertifikasi lampau berhasil dimuat.", data: await listPastCertifications(user.id) });
  } catch (error: unknown) { return handleError(error, user.id, "list"); }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("certification.create")) return failure("Anda tidak memiliki izin menambah sertifikasi.", 403);
  try {
    const form = await request.formData();
    const parsed = pastCertificationSchema.safeParse({
      productName: form.get("productName"), sniNumber: form.get("sniNumber"), spptSniNumber: form.get("spptSniNumber"),
      skpNumber: form.get("skpNumber"), spptIssuedAt: form.get("spptIssuedAt"), spptExpiresAt: form.get("spptExpiresAt"),
      certificationStatus: form.get("certificationStatus"), notes: form.get("notes"),
    });
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data sertifikasi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const rawFile = form.get("document");
    const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
    const data = await createPastCertification(user.id, parsed.data, file, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Sertifikasi lampau berhasil disimpan.", data }, { status: 201 });
  } catch (error: unknown) { return handleError(error, user.id, "create"); }
}

function failure(message: string, status: number) { return NextResponse.json({ success: false, message }, { status }); }
function handleError(error: unknown, userId: string, operation: string) {
  const known = getPastCertificationError(error);
  if (known.status === 500) console.error("Past certification request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
