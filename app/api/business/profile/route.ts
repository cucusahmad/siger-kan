import { NextResponse } from "next/server";

import { businessProfileSchema } from "@/lib/business/business-profile-schema";
import { getBusinessProfileData, updateBusinessProfile } from "@/lib/business/business-profile-service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.read")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk melihat profil usaha." }, { status: 403 });
  const data = await getBusinessProfileData(user.id, user.permissions.includes("business.update"));
  if (!data) return NextResponse.json({ success: false, message: "Tidak ada usaha yang terhubung dengan akun Anda." }, { status: 404 });
  return NextResponse.json({ success: true, message: "Profil usaha berhasil dimuat.", data });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.update")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengubah profil usaha." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Data permintaan tidak valid." }, { status: 400 }); }
  const parsed = businessProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    await updateBusinessProfile(user.id, parsed.data, getRequestContext(request));
    const data = await getBusinessProfileData(user.id, true);
    return NextResponse.json({ success: true, message: "Profil usaha berhasil disimpan.", data });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "";
    if (code === "FORBIDDEN") return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengubah profil usaha ini." }, { status: 403 });
    const hierarchyMessages: Readonly<Record<string, string>> = { INVALID_REGENCY: "Kabupaten/Kota tidak sesuai dengan provinsi.", INVALID_DISTRICT: "Kecamatan tidak sesuai dengan Kabupaten/Kota.", INVALID_VILLAGE: "Desa/Kelurahan tidak sesuai dengan kecamatan.", INVALID_COMMODITY: "Salah satu komoditas tidak tersedia." };
    if (hierarchyMessages[code]) return NextResponse.json({ success: false, message: hierarchyMessages[code] }, { status: 422 });
    console.error("Business profile update failed", { userId: user.id, error });
    return NextResponse.json({ success: false, message: "Profil usaha belum dapat disimpan. Silakan coba kembali." }, { status: 500 });
  }
}
