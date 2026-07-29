import { NextResponse } from "next/server";

import { businessNeedActionSchema, businessNeedInputSchema } from "@/features/business-needs/business-need.schema";
import { changeBusinessNeedStatus, deleteBusinessNeed, getBusinessNeedError, updateBusinessNeed } from "@/features/business-needs/business-need.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly needId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengubah kebutuhan.", 403);
  const parsed = businessNeedInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data kebutuhan.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const { needId } = await context.params;
    return NextResponse.json({ success: true, message: "Kebutuhan berhasil diperbarui.", data: await updateBusinessNeed(user.id, needId, parsed.data, getRequestContext(request)) });
  } catch (error: unknown) {
    return needFailure(error, user.id, "update");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk mengubah status kebutuhan.", 403);
  const parsed = businessNeedActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Aksi kebutuhan tidak valid.", 422);
  try {
    const { needId } = await context.params;
    const data = await changeBusinessNeedStatus(user.id, needId, parsed.data.action, getRequestContext(request));
    const message = parsed.data.action === "PUBLISH" ? "Kebutuhan berhasil dipublikasikan." : parsed.data.action === "CLOSE" ? "Kebutuhan berhasil ditutup." : "Kebutuhan berhasil dibuka kembali.";
    return NextResponse.json({ success: true, message, data });
  } catch (error: unknown) {
    return needFailure(error, user.id, "status");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  if (!user.permissions.includes("business.update")) return failure("Anda tidak memiliki izin untuk menghapus kebutuhan.", 403);
  try {
    const { needId } = await context.params;
    await deleteBusinessNeed(user.id, needId, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Draf kebutuhan berhasil dihapus.", data: null });
  } catch (error: unknown) {
    return needFailure(error, user.id, "delete");
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function needFailure(error: unknown, userId: string, operation: string) {
  const known = getBusinessNeedError(error);
  if (known.status === 500) console.error("Business need request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
