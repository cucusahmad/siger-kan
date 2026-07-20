import { NextResponse } from "next/server";
import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { activateMemberEmail } from "@/features/admin-dinas/admin-dinas.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function POST(request: Request, { params }: { readonly params: Promise<{ businessId: string; userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!isAdminDinas(user)) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengaktifkan email." }, { status: 403 });
  try { const { businessId, userId } = await params; await activateMemberEmail(user.id, businessId, userId, getRequestContext(request)); return NextResponse.json({ success: true, message: "Email pengguna berhasil diaktifkan.", data: {} }); }
  catch (error: unknown) { if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ success: false, message: "Pengguna usaha tidak ditemukan." }, { status: 404 }); console.error("Admin email activation failed", { actorUserId: user.id, error }); return NextResponse.json({ success: false, message: "Aktivasi email belum dapat diproses." }, { status: 500 }); }
}
