import { NextResponse } from "next/server";

import { ProductStatus } from "@/app/generated/prisma/client";
import { getVerificationError, listProductsForVerification } from "@/features/products/product-verification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const statusValue = new URL(request.url).searchParams.get("status");
    const status = statusValue && Object.values(ProductStatus).includes(statusValue as ProductStatus) ? statusValue as ProductStatus : undefined;
    const data = await listProductsForVerification(user, status);
    return NextResponse.json({ success: true, message: "Daftar produk berhasil dimuat.", data });
  } catch (error: unknown) {
    const known = getVerificationError(error);
    if (known.status === 500) console.error("Product verification list failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

