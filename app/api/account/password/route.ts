import { NextResponse } from "next/server";

import { AccountError, changePassword } from "@/features/account/account.service";
import { changePasswordSchema } from "@/features/account/account.schema";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function PUT(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Sesi Anda telah berakhir.", errors: {} }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Data permintaan tidak valid.", errors: {} }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Periksa kembali data yang diisi.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    await changePassword(user.id, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Password berhasil diubah.", data: {} });
  } catch (error: unknown) {
    if (error instanceof AccountError && error.code === "INVALID_CURRENT_PASSWORD") {
      return NextResponse.json(
        { success: false, message: "Password saat ini tidak sesuai.", errors: { currentPassword: ["Password saat ini tidak sesuai."] } },
        { status: 422 },
      );
    }
    if (error instanceof AccountError && error.code === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "Akun tidak ditemukan.", errors: {} }, { status: 404 });
    }
    console.error("Password change failed", { userId: user.id, errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ success: false, message: "Password belum dapat diubah. Silakan coba kembali.", errors: {} }, { status: 500 });
  }
}
