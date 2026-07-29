import { NextResponse } from "next/server";

import { createProduct, getProductError, getProductPageData } from "@/features/products/product.service";
import { productInputSchema } from "@/features/products/product.schema";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.read")) return failure("Anda tidak memiliki izin untuk melihat produk.", 403);
  try {
    const data = await getProductPageData(user.id, user.permissions.includes("business.update"));
    return NextResponse.json({ success: true, message: "Produk berhasil dimuat.", data });
  } catch (error: unknown) {
    return productFailure(error, user.id, "list");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk menambah produk.", 403);
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data produk.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const data = await createProduct(user.id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Produk berhasil ditambahkan.", data }, { status: 201 });
  } catch (error: unknown) {
    return productFailure(error, user.id, "create");
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function productFailure(error: unknown, userId: string, operation: string) {
  const known = getProductError(error);
  if (known.status === 500) console.error("Product request failed", { userId, operation, error });
  return failure(known.message, known.status);
}

