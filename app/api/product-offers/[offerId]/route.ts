import { NextResponse } from "next/server";

import { productOfferActionSchema } from "@/features/product-offers/product-offer.schema";
import { changeProductOfferStatus, getProductOfferError } from "@/features/product-offers/product-offer.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly offerId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengelola penawaran.", 403);
  const parsed = productOfferActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Aksi penawaran tidak valid.", 422);
  try {
    const { offerId } = await context.params;
    const data = await changeProductOfferStatus(
      user.id,
      offerId,
      parsed.data.action,
      parsed.data.notes,
      getRequestContext(request),
    );
    const message = parsed.data.action === "WITHDRAW"
      ? "Penawaran berhasil ditarik."
      : parsed.data.action === "ACCEPT"
        ? "Penawaran berhasil diterima."
        : "Penawaran berhasil ditolak.";
    return NextResponse.json({ success: true, message, data });
  } catch (error: unknown) {
    const known = getProductOfferError(error);
    if (known.status === 500) console.error("Product offer status failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
