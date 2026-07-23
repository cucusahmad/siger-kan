"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

interface ReviewParameter { readonly id: string; readonly name: string; readonly sampleName: string | null; readonly method: string | null }
interface SampleReviewValues {
  personnelReady: boolean; equipmentReady: boolean; methodAvailable: boolean; laboratoryCapable: boolean; subcontractRequired: boolean;
  parameters: { applicationParameterId: string; decision: "DAPAT_DIUJI_INTERNAL" | "SUBKONTRAK"; notes: string }[]; notes: string;
}

interface ReviewMessage {
  readonly text: string;
  readonly type: "error" | "success";
}

const reviewItems = [
  ["personnelReady", "Kesiapan personel", "Siap", "Belum siap"], ["equipmentReady", "Kesiapan alat", "Siap", "Belum siap"],
  ["methodAvailable", "Ketersediaan metode", "Tersedia", "Tidak tersedia"], ["laboratoryCapable", "Kemampuan laboratorium", "Mampu", "Tidak mampu"],
  ["subcontractRequired", "Kebutuhan subkontrak", "Diperlukan", "Tidak diperlukan"],
] as const;

export function SampleReviewForm({ applicationId, parameters }: { readonly applicationId: string; readonly parameters: readonly ReviewParameter[] }) {
  const router = useRouter(); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState<ReviewMessage | null>(null);
  const { control, register, handleSubmit } = useForm<SampleReviewValues>({ defaultValues: {
    personnelReady: false, equipmentReady: false, methodAvailable: false, laboratoryCapable: false, subcontractRequired: false,
    parameters: parameters.map(({ id }) => ({ applicationParameterId: id, decision: "DAPAT_DIUJI_INTERNAL", notes: "" })), notes: "",
  } });
  const { fields } = useFieldArray({ control, name: "parameters" });
  const decisions = useWatch({ control, name: "parameters" });
  async function submit(values: SampleReviewValues) {
    setMessage(null);

    const hasInternalParameter = values.parameters.some((item) => item.decision === "DAPAT_DIUJI_INTERNAL");
    const missingReadiness = [
      [values.personnelReady, "kesiapan personel"],
      [values.equipmentReady, "kesiapan alat"],
      [values.methodAvailable, "ketersediaan metode"],
      [values.laboratoryCapable, "kemampuan laboratorium"],
    ].filter(([ready]) => !ready).map(([, label]) => label);

    if (hasInternalParameter && missingReadiness.length > 0) {
      setMessage({ type: "error", text: `Parameter yang diuji internal mensyaratkan: ${missingReadiness.join(", ")}. Pilih kondisi siap atau ubah keputusan parameter menjadi subkontrak.` });
      return;
    }

    const subcontractParameters = values.parameters.filter((item) => item.decision === "SUBKONTRAK");
    if (subcontractParameters.length > 0 && !values.subcontractRequired) {
      setMessage({ type: "error", text: "Pilih 'Diperlukan' pada kebutuhan subkontrak karena terdapat parameter yang diputuskan untuk disubkontrakkan." });
      return;
    }

    if (subcontractParameters.some((item) => !item.notes.trim())) {
      setMessage({ type: "error", text: "Alasan subkontrak wajib diisi untuk setiap parameter yang disubkontrakkan." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/testing-applications/${applicationId}/sample-review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage({ type: result.success ? "success" : "error", text: result.success ? "Kaji ulang berhasil disimpan. Work Order telah dibuat dan siap ditugaskan kepada analis." : result.message });
      if (result.success) router.refresh();
    } catch {
      setMessage({ type: "error", text: "Kaji ulang gagal diselesaikan. Silakan coba kembali." });
    } finally {
      setSubmitting(false);
    }
  }
  return <form onSubmit={handleSubmit(submit)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="font-bold text-[#073B4C]">Kaji Ulang Kesiapan Pengujian</h2><p className="mt-2 text-sm leading-6 text-slate-500">Tetapkan keputusan untuk setiap parameter. Work Order akan dibuat otomatis setelah kaji ulang diselesaikan.</p>
    <div className="mt-5 space-y-4">{reviewItems.map(([name, label, yes, no]) => <fieldset key={name} className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-semibold text-slate-700">{label}</legend><Controller control={control} name={name} render={({ field }) => <div className="mt-1 grid grid-cols-2 gap-2">{[[true, yes], [false, no]].map(([value, text]) => { const booleanValue = value === true; return <label key={String(value)} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"><input type="radio" name={field.name} checked={field.value === booleanValue} onBlur={field.onBlur} onChange={() => field.onChange(booleanValue)}/>{text}</label>; })}</div>}/></fieldset>)}</div>
    <div className="mt-5 space-y-3"><h3 className="text-sm font-bold text-[#073B4C]">Keputusan per parameter</h3>{fields.map((field, index) => { const parameter = parameters[index]; const isSubcontract = decisions?.[index]?.decision === "SUBKONTRAK"; return <fieldset key={field.id} className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-semibold text-slate-700">{parameter.name}</legend><p className="mb-2 text-xs text-slate-500">Sampel: {parameter.sampleName || "-"}{parameter.method ? ` · Metode acuan: ${parameter.method}` : ""}</p><input type="hidden" {...register(`parameters.${index}.applicationParameterId`)}/><select {...register(`parameters.${index}.decision`)} className="w-full rounded-lg border border-slate-200 p-2 text-sm"><option value="DAPAT_DIUJI_INTERNAL">Dapat diuji internal</option><option value="SUBKONTRAK">Subkontrak</option></select>{isSubcontract && <textarea {...register(`parameters.${index}.notes`, { required: true })} rows={2} className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Alasan subkontrak (wajib)"/>}</fieldset>; })}</div>
    <label className="mt-4 block text-sm font-semibold text-slate-700">Catatan umum<textarea {...register("notes", { maxLength: 3000 })} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label>
    {message && <p role={message.type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p>}
    <button disabled={submitting || parameters.length === 0} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073B4C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? <LoaderCircle size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} Selesaikan Kaji Ulang</button>
  </form>;
}
