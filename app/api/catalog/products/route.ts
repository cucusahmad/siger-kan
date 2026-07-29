import { NextResponse } from "next/server";

import { getProductCatalogData } from "@/features/product-catalog/product-catalog.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.read")) return failure("Anda tidak memiliki izin untuk melihat katalog.", 403);
  try {
    const data = await getProductCatalogData(user.id, user.permissions.includes("business.update"));
    return NextResponse.json({ success: true, message: "Katalog berhasil dimuat.", data });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "BUSINESS_NOT_FOUND") {
      return failure("Usaha aktif tidak ditemukan.", 404);
    }
    console.error("Product catalog request failed", { userId: user.id, error });
    return failure("Katalog belum dapat dimuat.", 500);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
