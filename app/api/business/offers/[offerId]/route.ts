import { NextResponse } from "next/server";

import { businessOfferActionSchema } from "@/features/business-offers/business-offer.schema";
import { changeBusinessOfferStatus, getBusinessOfferError } from "@/features/business-offers/business-offer.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly offerId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengelola penawaran.", 403);
  const parsed = businessOfferActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Aksi penawaran tidak valid.", 422);
  try {
    const { offerId } = await context.params;
    const data = await changeBusinessOfferStatus(user.id, offerId, parsed.data.action, parsed.data.notes, getRequestContext(request));
    const message = parsed.data.action === "WITHDRAW" ? "Penawaran berhasil ditarik."
      : parsed.data.action === "ACCEPT" ? "Penawaran berhasil diterima." : "Penawaran berhasil ditolak.";
    return NextResponse.json({ success: true, message, data });
  } catch (error: unknown) {
    const known = getBusinessOfferError(error);
    if (known.status === 500) console.error("Business offer request failed", { userId: user.id, operation: "status", error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
