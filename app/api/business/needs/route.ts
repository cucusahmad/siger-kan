import { NextResponse } from "next/server";

import { createBusinessNeed, getBusinessNeedError, getBusinessNeedPageData } from "@/features/business-needs/business-need.service";
import { businessNeedInputSchema } from "@/features/business-needs/business-need.schema";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.read")) return failure("Anda tidak memiliki izin untuk melihat kebutuhan usaha.", 403);
  try {
    return NextResponse.json({ success: true, message: "Kebutuhan berhasil dimuat.", data: await getBusinessNeedPageData(user.id, user.permissions.includes("business.update")) });
  } catch (error: unknown) {
    return needFailure(error, user.id, "list");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk menambah kebutuhan.", 403);
  const parsed = businessNeedInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data kebutuhan.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const data = await createBusinessNeed(user.id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Kebutuhan berhasil disimpan sebagai draf.", data }, { status: 201 });
  } catch (error: unknown) {
    return needFailure(error, user.id, "create");
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function needFailure(error: unknown, userId: string, operation: string) {
  const known = getBusinessNeedError(error);
  if (known.status === 500) console.error("Business need request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
