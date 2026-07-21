import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";

export async function requireApplicant(permission: "read" | "create" | "update") {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("PELAKU_USAHA") || !user.permissions.includes(`laboratory.request.${permission}`)) throw new Error("FORBIDDEN");
  const membership = await resolveCurrentBusiness(user.id);
  if (!membership) throw new Error("BUSINESS_REQUIRED");
  return { user, membership };
}

export async function requireSampleReceptionOfficer() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("PETUGAS_PENERIMAAN_SAMPEL") || !user.permissions.includes("laboratory.sample.receive")) throw new Error("FORBIDDEN");
  return user;
}

export function applicationError(error: unknown): { readonly status: number; readonly message: string } {
  const code = error instanceof Error ? error.message : "";
  const values: Readonly<Record<string, { status: number; message: string }>> = {
    UNAUTHENTICATED: { status: 401, message: "Sesi Anda telah berakhir." }, FORBIDDEN: { status: 403, message: "Anda tidak memiliki akses ke fitur ini." },
    BUSINESS_REQUIRED: { status: 403, message: "Akun belum terhubung ke profil usaha." }, NOT_FOUND: { status: 404, message: "Permohonan tidak ditemukan." },
    NOT_DRAFT: { status: 409, message: "Permohonan tidak dapat diubah pada status saat ini." }, INVALID_STATUS: { status: 409, message: "Status permohonan tidak dapat diproses." }, INVALID_MASTER: { status: 422, message: "Laboratorium atau parameter pengujian tidak valid." },
  };
  return values[code] ?? { status: 500, message: "Terjadi kesalahan. Silakan coba kembali." };
}
