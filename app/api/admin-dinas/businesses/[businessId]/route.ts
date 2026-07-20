import { NextResponse } from "next/server";
import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { updateAdminBusiness } from "@/features/admin-dinas/admin-dinas.service";
import { adminBusinessUpdateSchema } from "@/features/admin-dinas/admin-dinas.validation";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function PUT(request: Request, { params }: { readonly params: Promise<{ businessId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!isAdminDinas(user)) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengubah data usaha." }, { status: 403 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Data permintaan tidak valid." }, { status: 400 }); }
  const parsed = adminBusinessUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try { await updateAdminBusiness(user.id, (await params).businessId, parsed.data, getRequestContext(request)); return NextResponse.json({ success: true, message: "Data pelaku usaha berhasil diperbarui.", data: {} }); }
  catch (error: unknown) { if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ success: false, message: "Pelaku usaha tidak ditemukan." }, { status: 404 }); console.error("Admin business update failed", { actorUserId: user.id, error }); return NextResponse.json({ success: false, message: "Data belum dapat disimpan." }, { status: 500 }); }
}
