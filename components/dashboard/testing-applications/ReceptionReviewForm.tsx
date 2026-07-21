"use client";

import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

interface ReviewFormValues {
  readonly applicantData: boolean;
  readonly productData: boolean;
  readonly sampleData: boolean;
  readonly testingParameters: boolean;
  readonly supportingDocuments: boolean;
  readonly notes: string;
}

interface Props { readonly applicationId: string }

const checklistItems: readonly { readonly name: keyof Omit<ReviewFormValues, "notes">; readonly label: string; readonly description: string }[] = [
  { name: "applicantData", label: "Identitas dan data pelaku usaha", description: "Profil pemohon serta tujuan pengujian sesuai." },
  { name: "productData", label: "Informasi produk", description: "Nama, jenis, bentuk, dan deskripsi produk lengkap." },
  { name: "sampleData", label: "Data sampel", description: "Jumlah, berat, kemasan, kondisi, dan sampling sesuai." },
  { name: "testingParameters", label: "Parameter pengujian", description: "Parameter telah dipetakan ke sampel yang benar." },
  { name: "supportingDocuments", label: "Dokumen pendukung", description: "Dokumen dapat dibuka dan isinya relevan." },
];

export function ReceptionReviewForm({ applicationId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { control, register, getValues } = useForm<ReviewFormValues>({ defaultValues: { applicantData: false, productData: false, sampleData: false, testingParameters: false, supportingDocuments: false, notes: "" } });
  const checklist = useWatch({ control });
  const allComplete = checklistItems.every((item) => checklist[item.name]);

  async function submit(decision: "APPROVE" | "REQUEST_REVISION") {
    const values = getValues();
    if (decision === "APPROVE" && !allComplete) { setMessage("Centang seluruh checklist sebelum menyetujui permohonan."); return; }
    if (decision === "REQUEST_REVISION" && !values.notes.trim()) { setMessage("Tuliskan kekurangan yang perlu diperbaiki pelaku usaha."); return; }
    setSubmitting(true); setMessage("");
    try {
      const { notes, ...checklist } = values;
      const response = await fetch(`/api/testing-applications/${applicationId}/reception-review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, checklist, notes }) });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) { router.push("/dashboard/quality-testing/sample-reception?updated=1"); router.refresh(); }
    } catch { setMessage("Verifikasi gagal disimpan. Silakan coba kembali."); } finally { setSubmitting(false); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-[#073B4C]">Checklist Verifikasi</h2><p className="mt-1 text-sm text-slate-500">Periksa setiap bagian berdasarkan data permohonan.</p><div className="mt-5 space-y-3">{checklistItems.map((item) => <label key={item.name} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:border-[#0FA3B1]"><input type="checkbox" {...register(item.name)} className="mt-1 h-4 w-4 accent-[#087E8B]"/><span><strong className="block text-sm text-slate-700">{item.label}</strong><span className="mt-1 block text-xs text-slate-500">{item.description}</span></span></label>)}</div><label className="mt-5 block text-sm font-semibold text-slate-700">Catatan petugas<textarea {...register("notes")} rows={5} maxLength={3000} placeholder="Jelaskan bagian yang kurang dan tindakan perbaikan yang diperlukan." className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#0FA3B1]"/></label>{message && <p role="status" className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm text-[#073B4C]">{message}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" disabled={submitting} onClick={() => void submit("REQUEST_REVISION")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400 px-4 py-3 text-sm font-bold text-amber-700 disabled:opacity-50"><RotateCcw size={17}/> Minta Perbaikan</button><button type="button" disabled={submitting || !allComplete} onClick={() => void submit("APPROVE")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E9F6B] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? <LoaderCircle size={17} className="animate-spin"/> : <CheckCircle2 size={17}/>} Setujui Permohonan</button></div></section>;
}
