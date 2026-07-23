"use client";

import { FileCheck2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ReportValues { readonly reportNumber: string; readonly reportDate: string; readonly conclusion: string; readonly notes: string }
interface Props { readonly applicationId: string; readonly applicationNumber: string; readonly defaultValues?: Partial<ReportValues> }

export function LaboratoryReportForm({ applicationId, applicationNumber, defaultValues }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<ReportValues>({ defaultValues: { reportDate: new Date().toISOString().slice(0, 10), ...defaultValues } });

  async function submit(values: ReportValues) {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/laboratory-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ testingApplicationId: applicationId, ...values }) });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) { router.refresh(); return; }
    } catch { setMessage("LHU belum dapat diajukan. Silakan coba kembali."); }
    setPending(false);
  }

  return <form onSubmit={handleSubmit(submit)} className="space-y-4">
    <div><p className="text-xs font-bold text-[#087E8B]">{applicationNumber}</p><h2 className="mt-1 font-bold text-[#073B4C]">Susun LHU</h2></div>
    <label className="block text-sm font-semibold text-slate-700">Nomor LHU<input {...register("reportNumber", { required: "Nomor LHU wajib diisi.", minLength: { value: 5, message: "Nomor LHU minimal 5 karakter." } })} placeholder="LHU/UPTD/2026/0001" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#087E8B]" /></label>
    {errors.reportNumber && <p className="text-xs text-red-600">{errors.reportNumber.message}</p>}
    <label className="block text-sm font-semibold text-slate-700">Tanggal LHU<input type="date" {...register("reportDate", { required: true })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#087E8B]" /></label>
    <label className="block text-sm font-semibold text-slate-700">Kesimpulan hasil<textarea {...register("conclusion", { required: "Kesimpulan wajib diisi.", minLength: { value: 20, message: "Kesimpulan minimal 20 karakter." } })} rows={5} placeholder="Tuliskan kesimpulan berdasarkan seluruh hasil pengujian..." className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#087E8B]" /></label>
    {errors.conclusion && <p className="text-xs text-red-600">{errors.conclusion.message}</p>}
    <label className="block text-sm font-semibold text-slate-700">Catatan tambahan<textarea {...register("notes")} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#087E8B]" /></label>
    {message && <p role="status" className="text-sm text-[#087E8B]">{message}</p>}
    <button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073B4C] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <FileCheck2 size={18} />} Ajukan ke Kepala UPTD</button>
  </form>;
}
