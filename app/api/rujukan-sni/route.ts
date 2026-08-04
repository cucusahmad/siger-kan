import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCertificationApplicant } from "@/features/certification-applications/certification-application.auth";
import { certificationApiError } from "@/features/certification-applications/certification-api";

export async function GET() {
  try {
    await requireCertificationApplicant();
    const standards = await prisma.rujukanSni.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ judulStandar: "asc" }, { nomorSni: "asc" }],
      select: { id: true, judulStandar: true, nomorSni: true },
    });
    return NextResponse.json({
      success: true,
      message: "Daftar standar kesesuaian berhasil dimuat.",
      data: standards.map((standard) => ({ id: standard.id.toString(), judul_standar: standard.judulStandar, nomor_sni: standard.nomorSni })),
    });
  } catch (error: unknown) {
    return certificationApiError(error);
  }
}
