import { NextResponse } from "next/server";

import { productOfferInputSchema } from "@/features/product-offers/product-offer.schema";
import { createProductOffer, getProductOfferError, getProductOfferPageData } from "@/features/product-offers/product-offer.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.read")) return failure("Anda tidak memiliki izin untuk melihat penawaran.", 403);
  try {
    const data = await getProductOfferPageData(user.id);
    return NextResponse.json({ success: true, message: "Penawaran berhasil dimuat.", data });
  } catch (error: unknown) {
    return handleError(error, user.id, "list");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengajukan penawaran.", 403);
  const parsed = productOfferInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Periksa kembali data penawaran.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  try {
    const data = await createProductOffer(user.id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Penawaran berhasil diajukan kepada pemilik produk.", data }, { status: 201 });
  } catch (error: unknown) {
    return handleError(error, user.id, "create");
  }
}

function handleError(error: unknown, userId: string, operation: string) {
  const known = getProductOfferError(error);
  if (known.status === 500) console.error("Product offer request failed", { userId, operation, error });
  return failure(known.message, known.status);
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
