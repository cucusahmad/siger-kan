import { NextResponse } from "next/server";

import { decideProductVerification, getProductForVerification, getVerificationError } from "@/features/products/product-verification.service";
import { productVerificationSchema } from "@/features/products/product-verification.schema";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly productId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const { productId } = await context.params;
    const data = await getProductForVerification(user, productId);
    return NextResponse.json({ success: true, message: "Detail produk berhasil dimuat.", data });
  } catch (error: unknown) {
    return handle(error, user.id, "detail");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  const parsed = productVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali keputusan verifikasi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const { productId } = await context.params;
    const data = await decideProductVerification(user, productId, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: parsed.data.decision === "APPROVE" ? "Produk berhasil diverifikasi." : parsed.data.decision === "REVISION" ? "Produk dikembalikan untuk diperbaiki." : "Produk berhasil ditolak.", data });
  } catch (error: unknown) {
    return handle(error, user.id, "decision");
  }
}

function handle(error: unknown, userId: string, operation: string) {
  const known = getVerificationError(error);
  if (known.status === 500) console.error("Product verification request failed", { userId, operation, error });
  return failure(known.message, known.status);
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

