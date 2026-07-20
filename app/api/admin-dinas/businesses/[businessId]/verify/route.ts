import { NextResponse } from "next/server";
import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { verifyAdminBusiness } from "@/features/admin-dinas/admin-dinas.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request, { params }: { readonly params: Promise<{ businessId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!isAdminDinas(user)) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk memverifikasi usaha." }, { status: 403 });
  try { await verifyAdminBusiness(user.id, (await params).businessId, getRequestContext(request)); return NextResponse.json({ success: true, message: "Pelaku usaha berhasil diverifikasi.", data: {} }); }
  catch (error: unknown) { if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ success: false, message: "Pelaku usaha tidak ditemukan." }, { status: 404 }); console.error("Admin business verification failed", { actorUserId: user.id, error }); return NextResponse.json({ success: false, message: "Verifikasi belum dapat diproses." }, { status: 500 }); }
}
