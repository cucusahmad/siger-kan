import { NextResponse } from "next/server";

import { changeProductStatus, deleteProduct, getProductError, updateProduct } from "@/features/products/product.service";
import { productInputSchema, productStatusInputSchema } from "@/features/products/product.schema";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly productId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengubah produk.", 403);
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data produk.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const { productId } = await context.params;
    const data = await updateProduct(user.id, productId, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui.", data });
  } catch (error: unknown) {
    return productFailure(error, user.id, "update");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengubah status produk.", 403);
  const parsed = productStatusInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Aksi produk tidak valid.", 422);
  try {
    const { productId } = await context.params;
    const data = await changeProductStatus(user.id, productId, parsed.data.action, getRequestContext(request));
    return NextResponse.json({ success: true, message: parsed.data.action === "SUBMIT" ? "Produk berhasil diajukan untuk verifikasi." : "Status publikasi produk berhasil diperbarui.", data });
  } catch (error: unknown) {
    return productFailure(error, user.id, "status");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk menghapus produk.", 403);
  try {
    const { productId } = await context.params;
    await deleteProduct(user.id, productId, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Produk berhasil dihapus.", data: null });
  } catch (error: unknown) {
    return productFailure(error, user.id, "delete");
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

