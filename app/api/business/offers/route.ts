import { NextResponse } from "next/server";

import { businessOfferInputSchema } from "@/features/business-offers/business-offer.schema";
import { createBusinessOffer, getBusinessOfferError } from "@/features/business-offers/business-offer.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengirim penawaran.", 403);
  const parsed = businessOfferInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Periksa kembali data penawaran.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  try {
    const data = await createBusinessOffer(user.id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Penawaran berhasil dikirim.", data }, { status: 201 });
  } catch (error: unknown) {
    const known = getBusinessOfferError(error);
    if (known.status === 500) console.error("Business offer request failed", { userId: user.id, operation: "create", error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
