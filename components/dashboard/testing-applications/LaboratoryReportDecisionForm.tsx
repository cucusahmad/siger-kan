"use client";

import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface Values { readonly notes: string }
type Decision = "SETUJUI" | "KEMBALIKAN";

export function LaboratoryReportDecisionForm({ reportId }: { readonly reportId: string }) {
  const router = useRouter(); const [pending, setPending] = useState<Decision | null>(null); const [message, setMessage] = useState("");
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>();
  async function submit(values: Values, decision: Decision) {
    const notes = values.notes?.trim() || "";
    if (decision === "KEMBALIKAN" && notes.length < 10) { setError("notes", { message: "Alasan pengembalian minimal 10 karakter." }); return; }
    setPending(decision); setMessage("");
    try {
      const response = await fetch(`/api/laboratory-reports/${reportId}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, notes }) });
      const result = await response.json() as { readonly success: boolean; readonly message: string }; setMessage(result.message);
      if (result.success) { router.push("/dashboard/quality-testing/reports"); router.refresh(); return; }
    } catch { setMessage("Keputusan belum dapat diproses. Silakan coba kembali."); }
    setPending(null);
  }
  return <form className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Catatan Kepala UPTD<textarea {...register("notes")} rows={4} placeholder="Catatan persetujuan atau alasan perbaikan..." className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#087E8B]" /></label>{errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}{message && <p role="status" className="text-sm text-[#087E8B]">{message}</p>}<div className="grid gap-3"><button type="button" onClick={handleSubmit((values) => submit(values, "KEMBALIKAN"))} disabled={pending !== null} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60">{pending === "KEMBALIKAN" ? <LoaderCircle className="animate-spin" size={18} /> : <RotateCcw size={18} />} Kembalikan untuk Perbaikan</button><button type="button" onClick={handleSubmit((values) => submit(values, "SETUJUI"))} disabled={pending !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E9F6B] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pending === "SETUJUI" ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Setujui dan Terbitkan</button></div></form>;
}
