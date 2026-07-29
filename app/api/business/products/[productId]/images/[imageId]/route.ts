import { NextResponse } from "next/server";

import { deleteProductImage, getOwnedProductImage, getProductError } from "@/features/products/product.service";
import { readProductImage } from "@/features/products/product-storage";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly productId: string; readonly imageId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.read")) return failure("Anda tidak memiliki izin untuk melihat gambar.", 403);
  try {
    const { productId, imageId } = await context.params;
    const image = await getOwnedProductImage(user.id, productId, imageId);
    const bytes = await readProductImage(image.storageKey);
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": image.mimeType, "Content-Length": bytes.length.toString(), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error: unknown) {
    const known = getProductError(error);
    return failure(known.message, known.status);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk menghapus gambar.", 403);
  try {
    const { productId, imageId } = await context.params;
    await deleteProductImage(user.id, productId, imageId, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Gambar produk berhasil dihapus.", data: null });
  } catch (error: unknown) {
    const known = getProductError(error);
    if (known.status === 500) console.error("Product image delete failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
