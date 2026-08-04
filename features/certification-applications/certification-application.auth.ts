import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";

export async function requireCertificationApplicant() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("PELAKU_USAHA") || !user.permissions.includes("certification.create")) throw new Error("FORBIDDEN");
  const membership = await resolveCurrentBusiness(user.id);
  if (!membership) throw new Error("BUSINESS_REQUIRED");
  return { user, businessId: membership.businessId };
}

export async function requireCertificationReviewer() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.roleCodes.includes("PETUGAS_SERTIFIKASI") || !user.permissions.includes("certification.review")) throw new Error("FORBIDDEN");
  return user;
}

export function certificationError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const errors: Readonly<Record<string, { status: number; message: string }>> = {
    UNAUTHENTICATED: { status: 401, message: "Sesi Anda telah berakhir." }, FORBIDDEN: { status: 403, message: "Anda tidak memiliki akses ke fitur ini." },
    BUSINESS_REQUIRED: { status: 403, message: "Akun belum terhubung ke profil usaha." }, NOT_FOUND: { status: 404, message: "Permohonan sertifikasi tidak ditemukan." }, QUESTIONNAIRE_INCOMPLETE: { status: 422, message: "Lengkapi seluruh jawaban wajib, pernyataan, dan pengesahan kuesioner." },
    INVALID_STATUS: { status: 409, message: "Permohonan tidak dapat diproses pada status saat ini." }, DOCUMENT_REQUIRED: { status: 422, message: "Lengkapi seluruh enam dokumen persyaratan wajib." },
    INVALID_SNI_REFERENCE: { status: 422, message: "Pilihan standar kesesuaian tidak valid atau sudah tidak aktif." },
    PEMPEK_TYPE_REQUIRED: { status: 422, message: "Pilih minimal satu jenis produk Pempek." },
    QUESTIONNAIRE_REQUIRED: { status: 422, message: "Kuesioner DK 7.3 harus dikirim sebelum permohonan dapat dikaji ulang." },
    DECLARATION_REQUIRED: { status: 422, message: "Pernyataan persyaratan dan perjanjian lisensi wajib disetujui." },
    INVALID_FILE: { status: 422, message: "Dokumen wajib berupa PDF, JPG, atau PNG dengan ukuran maksimal 10 MB." },
    FILE_UNAVAILABLE: { status: 404, message: "Berkas dokumen tidak tersedia." },
    APPLICATION_INCOMPLETE: { status: 422, message: "Lengkapi seluruh informasi wajib sebelum mengajukan permohonan." },
    PAYMENT_PROOF_REQUIRED: { status: 422, message: "Unggah bukti transfer sebelum mengajukan pembayaran." },
    CORRECTIVE_PROOF_REQUIRED: { status: 422, message: "Unggah bukti tindakan perbaikan sebelum mengajukannya." },
  };
  return errors[code] ?? { status: 500, message: "Terjadi kesalahan. Silakan coba kembali." };
}
