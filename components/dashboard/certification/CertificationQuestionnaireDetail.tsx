"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, ImageIcon, LoaderCircle, XCircle } from "lucide-react";
import { qualitySystemQuestions } from "./CertificationQuestionnaireWizard";

interface QualityAnswer { readonly answer: "YES" | "NO" | null; readonly notes: string; readonly evidence: string }
interface Questionnaire {
  readonly applicantInformation: Readonly<Record<string, unknown>>; readonly productInformation: Readonly<Record<string, unknown>>;
  readonly productionInformation: Readonly<Record<string, unknown>>; readonly businessLegality: Readonly<Record<string, unknown>>;
  readonly humanResources: Readonly<Record<string, unknown>>; readonly certificationsAndProducts: Readonly<Record<string, unknown>>;
  readonly marketingChannels: readonly unknown[]; readonly qualitySystemAnswers: readonly QualityAnswer[];
  readonly sniEvaluation: Readonly<Record<string, unknown>>; readonly otherNotes: string; readonly declarationAccepted: boolean;
  readonly signatoryName: string; readonly signatoryPosition: string; readonly approvalDate: string; readonly electronicSignatureAccepted: boolean;
  readonly submittedAt: string | null;
}
interface Props { readonly applicationId: string }
interface FileValue { readonly id?: string; readonly name?: string; readonly originalFileName?: string; readonly mimeType?: string; readonly type?: string; readonly size?: number | string; readonly uploadedAt?: string }

const sections: ReadonlyArray<readonly [keyof Questionnaire, string]> = [
  ["applicantInformation", "1. Informasi Pemohon"], ["productInformation", "2. Informasi Produk"], ["productionInformation", "3. Proses Produksi"],
  ["businessLegality", "4. Legalitas UPI"], ["humanResources", "5. Sumber Daya Manusia"], ["certificationsAndProducts", "6. Sertifikasi dan Produk"],
  ["marketingChannels", "7. Jalur Pemasaran"], ["sniEvaluation", "9. Evaluasi Penerapan SNI"],
];
const fieldLabels: Readonly<Record<string, string>> = {
  upiName: "Nama UPI", officeAddress: "Alamat kantor", phone: "Nomor telepon", email: "E-mail", nib: "Nomor NIB", brandCertificateNumber: "Nomor sertifikat merek", yearEstablished: "Tahun pendirian", operationalYear: "Tahun mulai beroperasi", contactPerson: "Personel penghubung",
  brand: "Merek produk", productType: "Jenis produk", netWeight: "Berat bersih", netWeightUnit: "Satuan", shelfLife: "Masa simpan", productionDateFormat: "Format tanggal produksi", expiryDateFormat: "Format tanggal kedaluwarsa", sni: "SNI", labelInformation: "Informasi label", packagingType: "Jenis kemasan", productionCapacity: "Kapasitas produksi", averageProduction: "Produksi rata-rata", iceRequirement: "Kebutuhan dan asal es", iceRequirementAmount: "Jumlah kebutuhan es per hari", iceRequirementUnit: "Satuan kebutuhan es", iceOrigin: "Asal es", productPhotos: "Foto kemasan", front: "Tampak depan", back: "Tampak belakang", side: "Tampak samping",
  sameProductionLocation: "Lokasi produksi sama dengan alamat UPI", facility: "Fasilitas produksi", organizationStructure: "Struktur organisasi", responsiblePerson: "Penanggung jawab", processFlow: "Alur proses produksi", rawMaterials: "Bahan baku", additives: "Bumbu dan bahan tambahan", qualityDocuments: "Dokumen mutu", equipment: "Peralatan produksi",
  investment: "Status PMA/PMDN", establishment: "Akta pendirian", amendments: "Akta perubahan", amendmentAvailability: "Ketersediaan akta perubahan", hasAmendments: "Memiliki perubahan", amendmentReason: "Keterangan perubahan", industrialLicense: "Surat izin usaha tetap industri", npwp: "NPWP", profileConfirmed: "Konfirmasi profil UPI",
  tenagaKerja: "Tenaga kerja", memilikiTenagaAhliAsing: "Memiliki tenaga ahli asing", tenagaAhliAsing: "Tenaga ahli asing", pernahMengikutiPelatihan: "Pernah mengikuti pelatihan", alasanTidakPelatihan: "Alasan tidak mengikuti pelatihan", pelatihan: "Riwayat pelatihan",
  managementCertificates: "Sertifikat sistem manajemen", completeProcessFlow: "Alur lengkap produksi/pengolahan", certifiedProducts: "Produk yang disertifikasi", sniKnowledge: "Pengetahuan tentang SNI produk perikanan", readinessStatement: "Pernyataan kesiapan memahami SNI", productionCompliance: "Proses produksi sesuai SNI", nonComplianceReason: "Alasan belum sesuai SNI", productTesting: "Pengujian mutu produk sesuai SNI", testingDocument: "Lampiran hasil pengujian mutu", noTestingReason: "Alasan belum ada pengujian mutu",
  document: "Dokumen pendukung", file: "Berkas", halalCertificate: "Berkas sertifikat halal", availability: "Status ketersediaan", number: "Nomor", issuer: "Penerbit", issueDate: "Tanggal terbit", issuePlace: "Tempat terbit", validityMode: "Masa berlaku", validFrom: "Berlaku mulai", validUntil: "Berlaku sampai", notes: "Keterangan", reason: "Alasan", name: "Nama", origin: "Asal", otherOrigin: "Asal lainnya", supplierName: "Nama pemasok", supplierAddress: "Alamat pemasok", requirements: "Persyaratan", specification: "Spesifikasi", quantity: "Jumlah unit", percentage: "Persentase",
  function: "Fungsi bahan", hasPermit: "Memiliki izin edar", permitNumber: "Nomor izin edar", halalStatus: "Status halal", halalCertificateNumber: "Nomor sertifikat halal", halalValidUntil: "Masa berlaku sertifikat halal",
  requiresCalibration: "Memerlukan kalibrasi/tera", calibrationCertificateNumber: "Nomor sertifikat kalibrasi/tera", calibrationDate: "Tanggal kalibrasi/tera", calibrationValidUntil: "Masa berlaku kalibrasi/tera", calibrationIssuer: "Lembaga penerbit", noCalibrationReason: "Alasan tidak memerlukan kalibrasi/tera", ownershipStatus: "Status kepemilikan", ownerName: "Nama pemilik alat", rentalAgreementNumber: "Nomor perjanjian sewa", rentalStartDate: "Tanggal mulai sewa", rentalEndDate: "Tanggal berakhir sewa",
};
const enumLabels: Readonly<Record<string, string>> = { YES: "Ya", NO: "Tidak", AVAILABLE: "Tersedia", MISSING: "Tidak tersedia", NOT_APPLICABLE: "Tidak berlaku", DATE: "Sampai tanggal tertentu", UNLIMITED: "Tidak terbatas", BUSINESS_LIFETIME: "Selama usaha berjalan", OWNED: "Milik sendiri", RENTED: "Sewa", CERTIFIED: "Bersertifikat", NOT_CERTIFIED: "Belum bersertifikat", NOT_RELEVANT: "Tidak relevan", NOT_REQUIRED: "Tidak diperlukan", DOMESTIC: "Dalam negeri", INTERNATIONAL: "Luar negeri", DYNAMIC: "Diisi dalam sistem", UPLOAD: "Dokumen diunggah" };

export function CertificationQuestionnaireDetail({ applicationId }: Props) {
  const [data, setData] = useState<Questionnaire | null>(null); const [message, setMessage] = useState("");
  useEffect(() => { void fetch(`/api/certification-applications/${applicationId}/questionnaire`).then((response) => response.json()).then((result: { success: boolean; message: string; data?: Questionnaire }) => { if (result.success && result.data) setData(result.data); else setMessage(result.message); }); }, [applicationId]);
  if (message) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
  if (!data) return <div className="flex items-center gap-2 rounded-xl border bg-white p-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/>Memuat kuesioner DK 7.3...</div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div><p className="font-bold text-emerald-800">Kuesioner DK 7.3 telah dikirim</p><p className="mt-1 text-xs text-emerald-700">{data.submittedAt ? new Date(data.submittedAt).toLocaleString("id-ID") : "Tanggal pengiriman tidak tersedia"}</p></div><CheckCircle2 className="text-emerald-600"/></div>
    {sections.map(([key, title]) => <StructuredSection key={key} title={title} value={data[key]} applicationId={applicationId}/>) }
    <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">8. Kuesioner Sistem Mutu</h3><div className="mt-4 space-y-3">{qualitySystemQuestions.map((question, index) => { const answer = data.qualitySystemAnswers[index]; return <div key={question} className="rounded-xl border p-4"><div className="flex gap-3"><span className={`mt-0.5 ${answer?.answer === "YES" ? "text-emerald-600" : "text-red-500"}`}>{answer?.answer === "YES" ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}</span><div><p className="text-sm font-semibold">{index + 1}. {question}</p><p className="mt-2 text-xs font-bold uppercase text-slate-500">{answer?.answer === "YES" ? "Ya" : "Tidak"}</p>{answer?.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{answer.notes}</p>}{answer?.evidence && <p className="mt-1 text-xs text-[#087E8B]">Bukti: {answer.evidence}</p>}</div></div></div>; })}</div></section>
    <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">10. Pernyataan dan Pengesahan</h3><dl className="mt-4 grid gap-4 md:grid-cols-2"><Item label="Catatan lain" value={data.otherNotes}/><Item label="Pernyataan kebenaran data" value={data.declarationAccepted ? "Disetujui" : "Belum disetujui"}/><Item label="Nama penandatangan" value={data.signatoryName}/><Item label="Jabatan" value={data.signatoryPosition}/><Item label="Tanggal pengesahan" value={formatDate(data.approvalDate)}/><Item label="Persetujuan tanda tangan elektronik" value={data.electronicSignatureAccepted ? "Disetujui" : "Belum disetujui"}/></dl></section>
  </div>;
}

function StructuredSection({ title, value, applicationId }: { readonly title: string; readonly value: unknown; readonly applicationId: string }) { return <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">{title}</h3><div className="mt-4"><StructuredValue value={value} applicationId={applicationId}/></div></section>; }
function StructuredValue({ value, applicationId, label }: { readonly value: unknown; readonly applicationId: string; readonly label?: string }) {
  if (isFile(value)) return <Attachment label={label} file={value} applicationId={applicationId}/>;
  if (Array.isArray(value)) return value.length ? <div className="space-y-3">{value.map((entry, index) => <div key={objectKey(entry, index)} className="rounded-xl border bg-slate-50 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#087E8B]">{label ? `${label} ${index + 1}` : `Data ${index + 1}`}</p><StructuredValue value={entry} applicationId={applicationId}/></div>)}</div> : <p className="text-sm text-slate-500">Tidak ada data.</p>;
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([key, entry]) => key !== "id" && !isEmpty(entry));
    return entries.length ? <dl className="grid gap-4 md:grid-cols-2">{entries.map(([key, entry]) => <div key={key} className={isComplex(entry) ? "md:col-span-2" : ""}>{isComplex(entry) && !isFile(entry) && <dt className="mb-2 text-xs font-semibold text-slate-500">{labelFor(key)}</dt>}<StructuredValue value={entry} label={labelFor(key)} applicationId={applicationId}/></div>)}</dl> : <p className="text-sm text-slate-500">Tidak ada data.</p>;
  }
  return <Item label={label ?? "Informasi"} value={formatScalar(value)}/>;
}
function Attachment({ file, label, applicationId }: { readonly file: FileValue; readonly label?: string; readonly applicationId: string }) {
  const name = file.originalFileName ?? file.name ?? "Dokumen"; const imageFile = (file.mimeType ?? file.type ?? "").startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(name); const url = file.id ? `/api/certification-applications/${applicationId}/documents/${file.id}` : null;
  return <div><p className="mb-2 text-xs font-semibold text-slate-500">{label ?? "Dokumen"}</p><div className="overflow-hidden rounded-xl border bg-slate-50">{imageFile && url && <div className="relative aspect-[16/9] bg-slate-100"><Image src={`${url}?preview=1`} alt={`Pratinjau ${name}`} fill unoptimized className="object-contain"/></div>}<div className="flex flex-wrap items-center gap-3 p-3">{imageFile ? <ImageIcon size={19} className="shrink-0 text-[#087E8B]"/> : <FileText size={19} className="shrink-0 text-[#087E8B]"/>}<span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>{file.size && <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>}{url ? <a href={url} download className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white"><Download size={15}/> Unduh {imageFile ? "gambar" : "PDF"}</a> : <span className="text-xs text-amber-700">Berkas lama belum tersedia untuk diunduh</span>}</div></div></div>;
}
function Item({ label, value }: { readonly label: string; readonly value: string }) { return <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value || "-"}</dd></div>; }
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> { return !!value && typeof value === "object" && !Array.isArray(value); }
function isFile(value: unknown): value is FileValue { if (!isRecord(value)) return false; const name = value.originalFileName ?? value.name; return typeof name === "string" && ("id" in value || "size" in value || "uploadedAt" in value || "type" in value || "mimeType" in value); }
function isComplex(value: unknown) { return Array.isArray(value) || isRecord(value); }
function isEmpty(value: unknown) { return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0); }
function objectKey(value: unknown, index: number) { return isRecord(value) && typeof value.id === "string" ? value.id : String(index); }
function labelFor(key: string) { return fieldLabels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { if (!value) return "-"; const date = new Date(`${value.slice(0, 10)}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID"); }
function formatScalar(value: unknown): string { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "boolean") return value ? "Ya" : "Tidak"; if (typeof value === "string") return enumLabels[value] ?? (/^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : value); return String(value); }
function formatFileSize(value: number | string): string { const bytes = Number(value); if (!Number.isFinite(bytes) || bytes <= 0) return ""; return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
