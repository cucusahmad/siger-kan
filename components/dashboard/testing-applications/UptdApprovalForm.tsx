"use client";

import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UptdApprovalForm({ applicationId }: { readonly applicationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function decide(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !notes.trim()) { setMessage("Alasan penolakan wajib diisi."); return; }
    setSubmitting(true); setMessage("");
    try {
      const response = await fetch(`/api/testing-applications/${applicationId}/uptd-approval`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, notes }) });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) { router.push("/dashboard/quality-testing/uptd-approval?updated=1"); router.refresh(); }
    } catch { setMessage("Keputusan gagal disimpan."); } finally { setSubmitting(false); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-[#073B4C]">Keputusan Kepala UPTD</h2><p className="mt-1 text-sm text-slate-500">Persetujuan akan mengirim notifikasi pengiriman sampel kepada pelaku usaha.</p><label className="mt-5 block text-sm font-semibold text-slate-700">Catatan<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} maxLength={3000} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Catatan persetujuan atau alasan penolakan"/></label>{message && <p role="status" className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm text-[#073B4C]">{message}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><button disabled={submitting} onClick={() => void decide("REJECT")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-3 font-bold text-red-700 disabled:opacity-50"><XCircle size={17}/> Tolak</button><button disabled={submitting} onClick={() => void decide("APPROVE")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E9F6B] px-4 py-3 font-bold text-white disabled:opacity-50">{submitting ? <LoaderCircle className="animate-spin" size={17}/> : <CheckCircle2 size={17}/>} Setujui</button></div></section>;
}
