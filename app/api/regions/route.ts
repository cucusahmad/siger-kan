import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir." }, { status: 401 });
  if (!user.permissions.includes("business.read")) return NextResponse.json({ success: false, message: "Anda tidak memiliki izin untuk mengakses data wilayah usaha." }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const level = params.get("level"); const parentId = params.get("parentId");
  if (!parentId || !/^\d+$/.test(parentId) || !["regencies", "districts", "villages"].includes(level ?? "")) return NextResponse.json({ success: false, message: "Parameter wilayah tidak valid." }, { status: 400 });
  const id = BigInt(parentId);
  const rows = level === "regencies"
    ? await prisma.regency.findMany({ where: { provinceId: id, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : level === "districts"
      ? await prisma.district.findMany({ where: { regencyId: id, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      : await prisma.village.findMany({ where: { districtId: id, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return NextResponse.json({ success: true, message: "Data wilayah berhasil dimuat.", data: rows.map(({ id: rowId, name }) => ({ id: rowId.toString(), name })) });
}
