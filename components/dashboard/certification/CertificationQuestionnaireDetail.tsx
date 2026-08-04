"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { qualitySystemQuestions } from "./CertificationQuestionnaireWizard";

interface QualityAnswer { readonly answer: "YES" | "NO" | null; readonly notes: string; readonly evidence: string }
interface Questionnaire {
  readonly applicantInformation: Readonly<Record<string, unknown>>; readonly productInformation: Readonly<Record<string, unknown>>;
  readonly productionInformation: Readonly<Record<string, unknown>>; readonly businessLegality: Readonly<Record<string, unknown>>;
  readonly humanResources: Readonly<Record<string, unknown>>; readonly certificationsAndProducts: Readonly<Record<string, unknown>>;
  readonly marketingChannels: Readonly<Record<string, unknown>>; readonly qualitySystemAnswers: readonly QualityAnswer[];
  readonly sniEvaluation: Readonly<Record<string, unknown>>; readonly otherNotes: string; readonly declarationAccepted: boolean;
  readonly signatoryName: string; readonly signatoryPosition: string; readonly approvalDate: string; readonly electronicSignatureAccepted: boolean;
  readonly submittedAt: string | null;
}
interface Props { readonly applicationId: string }

const sectionLabels: ReadonlyArray<readonly [keyof Questionnaire, string]> = [
  ["applicantInformation", "1. Informasi Pemohon"], ["productInformation", "2. Informasi Produk"], ["productionInformation", "3. Proses Produksi"],
  ["businessLegality", "4. Legalitas UPI"], ["humanResources", "5. Sumber Daya Manusia"], ["certificationsAndProducts", "6. Sertifikasi dan Produk"],
  ["marketingChannels", "7. Jalur Pemasaran"], ["sniEvaluation", "9. Evaluasi Penerapan SNI"],
];
const fieldLabels: Readonly<Record<string, string>> = {
  upiName: "Nama UPI", officeAddress: "Alamat kantor", phone: "Nomor telepon", email: "E-mail", nib: "Nomor NIB", brandCertificateNumber: "Nomor sertifikat merek", yearEstablished: "Tahun pendirian", operationalYear: "Tahun mulai beroperasi", contactPerson: "Personel penghubung", brand: "Merek produk", productType: "Jenis produk", netWeight: "Berat bersih", shelfLife: "Masa simpan", productionDateFormat: "Format tanggal produksi", expiryDateFormat: "Format kedaluwarsa", sni: "SNI", labelInformation: "Informasi label", packagingType: "Kemasan", productionCapacity: "Kapasitas produksi", averageProduction: "Produksi rata-rata", iceRequirement: "Kebutuhan dan asal es", productPhotos: "Foto produk", totalPercentage: "Total persentase pemasaran",
};

export function CertificationQuestionnaireDetail({ applicationId }: Props) {
  const [data, setData] = useState<Questionnaire | null>(null); const [message, setMessage] = useState("");
  useEffect(() => { void fetch(`/api/certification-applications/${applicationId}/questionnaire`).then((response) => response.json()).then((result: { success: boolean; message: string; data?: Questionnaire }) => { if (result.success && result.data) setData(result.data); else setMessage(result.message); }); }, [applicationId]);
  if (message) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
  if (!data) return <div className="flex items-center gap-2 rounded-xl border bg-white p-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/>Memuat kuesioner DK 7.3...</div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div><p className="font-bold text-emerald-800">Kuesioner DK 7.3 telah dikirim</p><p className="mt-1 text-xs text-emerald-700">{data.submittedAt ? new Date(data.submittedAt).toLocaleString("id-ID") : "Tanggal pengiriman tidak tersedia"}</p></div><CheckCircle2 className="text-emerald-600"/></div>
    {sectionLabels.map(([key, title]) => <QuestionnaireSection key={key} title={title} values={data[key] as Readonly<Record<string, unknown>>}/>) }
    <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">8. Kuesioner Sistem Mutu</h3><div className="mt-4 space-y-3">{qualitySystemQuestions.map((question, index) => { const answer = data.qualitySystemAnswers[index]; return <div key={question} className="rounded-xl border p-4"><div className="flex gap-3"><span className={`mt-0.5 ${answer?.answer === "YES" ? "text-emerald-600" : "text-red-500"}`}>{answer?.answer === "YES" ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}</span><div><p className="text-sm font-semibold">{index + 1}. {question}</p><p className="mt-2 text-xs font-bold uppercase text-slate-500">{answer?.answer === "YES" ? "Ya" : "Tidak"}</p>{answer?.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{answer.notes}</p>}{answer?.evidence && <p className="mt-1 text-xs text-[#087E8B]">Bukti: {answer.evidence}</p>}</div></div></div>; })}</div></section>
    <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">10. Pernyataan dan Pengesahan</h3><dl className="mt-4 grid gap-4 md:grid-cols-2"><Item label="Catatan lain" value={data.otherNotes}/><Item label="Pernyataan kebenaran data" value={data.declarationAccepted ? "Disetujui" : "Belum disetujui"}/><Item label="Nama penandatangan" value={data.signatoryName}/><Item label="Jabatan" value={data.signatoryPosition}/><Item label="Tanggal pengesahan" value={data.approvalDate ? new Date(`${data.approvalDate}T00:00:00`).toLocaleDateString("id-ID") : "-"}/><Item label="Persetujuan tanda tangan elektronik" value={data.electronicSignatureAccepted ? "Disetujui" : "Belum disetujui"}/></dl></section>
  </div>;
}

function QuestionnaireSection({ title, values }: { readonly title: string; readonly values: Readonly<Record<string, unknown>> }) { return <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-[#073B4C]">{title}</h3><dl className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(values).map(([key, value]) => <Item key={key} label={fieldLabels[key] ?? humanize(key)} value={display(value)}/>)}</dl>{Object.keys(values).length === 0 && <p className="mt-4 text-sm text-slate-500">Tidak ada data.</p>}</section>; }
function Item({ label, value }: { readonly label: string; readonly value: string }) { return <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value || "-"}</dd></div>; }
function display(value: unknown): string { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value); return JSON.stringify(value, null, 2); }
function humanize(value: string): string { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
