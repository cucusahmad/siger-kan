"use client";

import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface VerificationValues { readonly notes: string }
type VerificationDecision = "SETUJUI" | "KEMBALIKAN";

export function ResultVerificationForm({ workOrderId }: { readonly workOrderId: string }) {
  const router = useRouter();
  const [pendingDecision, setPendingDecision] = useState<VerificationDecision | null>(null);
  const [message, setMessage] = useState("");
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<VerificationValues>();

  async function submit(values: VerificationValues, decision: VerificationDecision) {
    const notes = values.notes?.trim() || "";
    if (decision === "KEMBALIKAN" && notes.length < 10) {
      setError("notes", { type: "validate", message: "Alasan pengembalian minimal 10 karakter." });
      return;
    }

    clearErrors("notes");
    setPendingDecision(decision);
    setMessage("");
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/verify-result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, notes }) });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) { router.push("/dashboard/quality-testing/result-verification?updated=1"); router.refresh(); return; }
    } catch {
      setMessage("Keputusan belum dapat diproses. Silakan coba lagi.");
    }
    setPendingDecision(null);
  }

  const submitApproval = handleSubmit((values) => submit(values, "SETUJUI"));
  const submitRevision = handleSubmit((values) => submit(values, "KEMBALIKAN"));

  return <form className="space-y-4">
    <label className="block text-sm font-bold text-slate-700">Catatan penyelia
      <textarea {...register("notes")} rows={5} placeholder="Tuliskan catatan pemeriksaan atau alasan perbaikan..." className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#087E8B]" />
    </label>
    {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
    {message && <p role="status" className="text-sm text-[#087E8B]">{message}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={submitRevision} disabled={pendingDecision !== null} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60">{pendingDecision === "KEMBALIKAN" ? <LoaderCircle className="animate-spin" size={18} /> : <RotateCcw size={18} />} Kembalikan ke Analis</button>
      <button type="button" onClick={submitApproval} disabled={pendingDecision !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E9F6B] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pendingDecision === "SETUJUI" ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Verifikasi Hasil</button>
    </div>
  </form>;
}
