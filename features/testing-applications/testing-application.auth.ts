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

export async function requireUptdHead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("KEPALA_UPTD") || !user.permissions.includes("laboratory.request.read")) throw new Error("FORBIDDEN");
  return user;
}

export async function requireReportPreparer() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("PENYELIA_LAB") || !user.permissions.includes("laboratory.result.review")) throw new Error("FORBIDDEN");
  return user;
}

export async function requireReportApprover() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("KEPALA_UPTD") || !user.permissions.includes("laboratory.result.approve")) throw new Error("FORBIDDEN");
  return user;
}

async function requireLaboratoryRole(role: "PENYELIA_LAB" | "ANALIS_LAB", permission: string) { const user = await getCurrentUser(); if (!user) throw new Error("UNAUTHENTICATED"); if (!user.roleCodes.includes(role) || !user.permissions.includes(permission)) throw new Error("FORBIDDEN"); return user; }
export async function requireLaboratorySupervisor() { return requireLaboratoryRole("PENYELIA_LAB", "laboratory.result.review"); }
export async function requireLaboratoryAnalyst() { return requireLaboratoryRole("ANALIS_LAB", "laboratory.sample.test"); }

export function applicationError(error: unknown): { readonly status: number; readonly message: string } {
  const code = error instanceof Error ? error.message : "";
  const values: Readonly<Record<string, { status: number; message: string }>> = {
    UNAUTHENTICATED: { status: 401, message: "Sesi Anda telah berakhir." }, FORBIDDEN: { status: 403, message: "Anda tidak memiliki akses ke fitur ini." },
    BUSINESS_REQUIRED: { status: 403, message: "Akun belum terhubung ke profil usaha." }, NOT_FOUND: { status: 404, message: "Permohonan tidak ditemukan." },
    NOT_DRAFT: { status: 409, message: "Permohonan tidak dapat diubah pada status saat ini." }, INVALID_STATUS: { status: 409, message: "Status permohonan tidak dapat diproses." }, INVALID_MASTER: { status: 422, message: "Laboratorium atau parameter pengujian tidak valid." },
    FILE_UNAVAILABLE: { status: 404, message: "File dokumen tidak tersedia." },
    INVALID_SHIPMENT: { status: 422, message: "Data Berita Pengiriman Sampel belum lengkap atau tidak valid." },
    INVALID_FILE: { status: 422, message: "Bukti kirim wajib berupa foto atau PDF yang valid (maksimal 5 MB per file)." },
    INVALID_REVIEW: { status: 422, message: "Data kaji ulang belum lengkap atau keputusan tidak sesuai hasil pemeriksaan." },
    INVALID_WORK_ORDER: { status: 422, message: "Data penugasan Work Order belum lengkap atau tidak valid." },
    DOCUMENT_REQUIRED: { status: 422, message: "Unggah minimal satu dokumen hasil sebelum mengirim ke penyelia." },
    INVALID_VERIFICATION: { status: 422, message: "Keputusan verifikasi tidak valid. Alasan pengembalian minimal 10 karakter." },
    INVALID_REPORT: { status: 422, message: "Data LHU belum lengkap atau tidak valid." },
    WORK_ORDERS_INCOMPLETE: { status: 409, message: "LHU hanya dapat diajukan setelah seluruh hasil pengujian diverifikasi." },
    REPORT_NUMBER_EXISTS: { status: 409, message: "Nomor LHU sudah digunakan." },
    INVALID_REPORT_DECISION: { status: 422, message: "Keputusan LHU tidak valid. Alasan pengembalian minimal 10 karakter." },
    INVALID_FINAL_REPORT_FILE: { status: 422, message: "Dokumen final LHU wajib berupa PDF yang valid dengan ukuran maksimal 5 MB." },
  };
  return values[code] ?? { status: 500, message: "Terjadi kesalahan. Silakan coba kembali." };
}
