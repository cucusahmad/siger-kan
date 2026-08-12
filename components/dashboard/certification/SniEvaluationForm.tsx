"use client";

import { useState } from "react";
import { FileText, FileUp, LoaderCircle } from "lucide-react";

export interface SniEvaluationDocument { readonly id: string; readonly originalFileName: string }
export interface SniEvaluationData {
  readonly sniKnowledge: "YES" | "NO" | ""; readonly readinessStatement: string;
  readonly productionCompliance: "YES" | "NO" | ""; readonly nonComplianceReason: string;
  readonly productTesting: "YES" | "NO" | ""; readonly testingDocument: SniEvaluationDocument | null; readonly noTestingReason: string;
}
export const defaultSniEvaluation: SniEvaluationData = { sniKnowledge: "", readinessStatement: "", productionCompliance: "", nonComplianceReason: "", productTesting: "", testingDocument: null, noTestingReason: "" };

interface Props { readonly applicationId: string; readonly value: SniEvaluationData; readonly disabled: boolean; readonly onChange: (value: SniEvaluationData) => void; readonly onNotice: (message: string) => void }

export function SniEvaluationForm({ applicationId, value, disabled, onChange, onNotice }: Props) {
  const [uploading, setUploading] = useState(false);
  const update = <Key extends keyof SniEvaluationData>(key: Key, fieldValue: SniEvaluationData[Key]) => onChange({ ...value, [key]: fieldValue });
  async function upload(file: File) {
    setUploading(true); onNotice("");
    try {
      const formData = new FormData(); formData.set("file", file); formData.set("documentType", "OTHER"); formData.set("documentName", `Hasil pengujian mutu produk sesuai SNI - ${file.name}`);
      const response = await fetch(`/api/certification-applications/${applicationId}/documents`, { method: "POST", body: formData });
      const result = await response.json() as { success: boolean; message: string; data?: SniEvaluationDocument };
      if (result.success && result.data) { update("testingDocument", result.data); onNotice("Hasil pengujian mutu berhasil diunggah."); } else onNotice(result.message);
    } catch { onNotice("Hasil pengujian mutu gagal diunggah. Silakan coba kembali."); } finally { setUploading(false); }
  }
  return <div className="space-y-5">
    <p className="text-sm text-slate-600">Evaluasi Proses Produksi Berdasarkan Standar Nasional Indonesia</p>
    <Question number="1" text="Apakah UPI Anda sudah mengetahui tentang SNI produk perikanan?">
      <RadioOptions name="sniKnowledge" value={value.sniKnowledge} onChange={(answer) => update("sniKnowledge", answer)} yesLabel="Sudah" noLabel="Belum"/>
      {value.sniKnowledge === "NO" && <TextAnswer label="Jika belum, apakah UPI bersedia menyatakan kesiapannya secara tertulis untuk memahami SNI produk perikanan?" value={value.readinessStatement} onChange={(answer) => update("readinessStatement", answer)}/>} 
    </Question>
    <Question number="2" text="Apakah UPI Anda sudah melakukan proses produksi sesuai dengan SNI produk perikanan?">
      <RadioOptions name="productionCompliance" value={value.productionCompliance} onChange={(answer) => update("productionCompliance", answer)} yesLabel="Sudah" noLabel="Belum"/>
      {value.productionCompliance === "NO" && <TextAnswer label="Jika belum, jelaskan alasannya." value={value.nonComplianceReason} onChange={(answer) => update("nonComplianceReason", answer)}/>} 
    </Question>
    <Question number="3" text="Adakah pengujian mutu produk di UPI yang sudah sesuai dengan SNI produk perikanan?">
      <RadioOptions name="productTesting" value={value.productTesting} onChange={(answer) => update("productTesting", answer)} yesLabel="Ada" noLabel="Tidak Ada"/>
      {value.productTesting === "YES" && <div className="mt-4 rounded-xl border border-dashed border-[#0FA3B1] bg-cyan-50/40 p-4">
        {value.testingDocument ? <div className="flex items-center gap-3"><FileText className="text-[#087E8B]"/><p className="min-w-0 flex-1 truncate text-sm font-bold text-[#073B4C]">{value.testingDocument.originalFileName}</p><a href={`/api/certification-applications/${applicationId}/documents/${value.testingDocument.id}`} className="text-sm font-bold text-[#087E8B]">Lihat</a></div> : <p className="text-sm text-slate-600">Lampirkan hasil pengujian mutu produk.</p>}
        <label className={`mt-3 inline-flex items-center gap-2 rounded-xl bg-[#073B4C] px-4 py-2.5 text-sm font-bold text-white ${(disabled || uploading) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          {uploading ? <LoaderCircle className="animate-spin" size={17}/> : <FileUp size={17}/>} {uploading ? "Mengunggah..." : value.testingDocument ? "Ganti lampiran" : "Pilih lampiran"}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={disabled || uploading} className="sr-only" aria-label="Unggah hasil pengujian mutu produk" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }}/>
        </label><p className="mt-2 text-xs text-slate-500">Format PDF, JPG, atau PNG. Ukuran maksimal 10 MB.</p>
      </div>}
      {value.productTesting === "NO" && <TextAnswer label="Jelaskan alasan belum adanya pengujian mutu." value={value.noTestingReason} onChange={(answer) => update("noTestingReason", answer)}/>} 
    </Question>
  </div>;
}
function Question({ number, text, children }: { readonly number: string; readonly text: string; readonly children: React.ReactNode }) { return <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold text-[#073B4C]">{number}. {text}</legend><div className="mt-3">{children}</div></fieldset>; }
function RadioOptions({ name, value, onChange, yesLabel, noLabel }: { readonly name: string; readonly value: "YES" | "NO" | ""; readonly onChange: (value: "YES" | "NO") => void; readonly yesLabel: string; readonly noLabel: string }) { return <div className="flex flex-wrap gap-5"><label className="text-sm"><input type="radio" name={name} checked={value === "NO"} onChange={() => onChange("NO")} className="mr-2"/>{noLabel}</label><label className="text-sm"><input type="radio" name={name} checked={value === "YES"} onChange={() => onChange("YES")} className="mr-2"/>{yesLabel}</label></div>; }
function TextAnswer({ label, value, onChange }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void }) { return <label className="mt-4 block text-sm font-semibold">{label}<textarea rows={3} maxLength={2000} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}/></label>; }
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";
