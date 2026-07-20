import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/business/get-current-business";
import { businessCommoditiesSchema } from "@/lib/business-commodities/commodity-schema";
import { getBusinessCommodities, updateBusinessCommodities } from "@/lib/business-commodities/commodity-service";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.read")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk melihat komoditas usaha." }, { status: 403 });
  const data = await getBusinessCommodities(user.id, user.permissions.includes("business.update"));
  if (!data) return NextResponse.json({ success: false, message: "Tidak ada usaha yang terhubung dengan akun Anda." }, { status: 404 });
  return NextResponse.json({ success: true, message: "Komoditas usaha berhasil dimuat.", data });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.update")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengubah komoditas usaha." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Data permintaan tidak valid." }, { status: 400 }); }
  const parsed = businessCommoditiesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data komoditas.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    await updateBusinessCommodities(user.id, parsed.data, getRequestContext(request));
    const data = await getBusinessCommodities(user.id, true);
    return NextResponse.json({ success: true, message: "Komoditas usaha berhasil disimpan.", data });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "";
    if (code === "FORBIDDEN") return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengubah komoditas usaha ini." }, { status: 403 });
    if (code === "INVALID_COMMODITY") return NextResponse.json({ success: false, message: "Salah satu komoditas tidak tersedia." }, { status: 422 });
    if (code === "OTHER_DESCRIPTION_REQUIRED") return NextResponse.json({ success: false, message: "Keterangan komoditas lainnya wajib diisi." }, { status: 422 });
    console.error("Business commodities update failed", { userId: user.id, error });
    return NextResponse.json({ success: false, message: "Komoditas usaha belum dapat disimpan. Silakan coba kembali." }, { status: 500 });
  }
}
