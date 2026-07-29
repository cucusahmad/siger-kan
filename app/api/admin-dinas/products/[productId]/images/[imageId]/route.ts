import { NextResponse } from "next/server";

import { getVerificationError, getVerificationImage } from "@/features/products/product-verification.service";
import { readProductImage } from "@/features/products/product-storage";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ readonly productId: string; readonly imageId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const { productId, imageId } = await context.params;
    const image = await getVerificationImage(user, productId, imageId);
    const bytes = await readProductImage(image.storageKey);
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": image.mimeType, "Content-Length": bytes.length.toString(), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error: unknown) {
    const known = getVerificationError(error);
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
