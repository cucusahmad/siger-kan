import { NextResponse } from "next/server";

import { parseProductImage } from "@/features/products/product-image";
import { addProductImage, getProductError, getProductPageData } from "@/features/products/product.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly productId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengunggah gambar.", 403);
  try {
    const { productId } = await context.params;
    await addProductImage(user.id, productId, await parseProductImage(request), getRequestContext(request));
    const data = await getProductPageData(user.id, true);
    return NextResponse.json({ success: true, message: "Gambar produk berhasil ditambahkan.", data });
  } catch (error: unknown) {
    const known = getProductError(error);
    if (known.status === 500) console.error("Product image upload failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

