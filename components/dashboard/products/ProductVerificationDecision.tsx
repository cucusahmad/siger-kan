"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  readonly productId: string;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly errors?: { readonly notes?: readonly string[] };
}

export function ProductVerificationDecision({ productId }: Props) {
  const router = useRouter();
  const [decision, setDecision] = useState<"APPROVE" | "REVISION" | "REJECT">("APPROVE");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ readonly success: boolean; readonly message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setFeedback(null);
    const response = await fetch(`/api/admin-dinas/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes }),
    });
    const result = await response.json() as ApiResponse;
    setSubmitting(false);
    setFeedback({ success: result.success, message: result.errors?.notes?.[0] ?? result.message });
    if (result.success) {
      router.refresh();
      window.setTimeout(() => router.push("/dashboard/product-verification"), 700);
    }
  };

  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-[#073B4C]">Keputusan Verifikasi</h2>
    <p className="mt-1 text-sm text-slate-500">Pastikan identitas, narasi, harga, kapasitas, dan gambar produk sudah sesuai.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <DecisionButton active={decision === "APPROVE"} onClick={() => setDecision("APPROVE")} icon={<CheckCircle2 size={18} />} label="Setujui" color="emerald" />
      <DecisionButton active={decision === "REVISION"} onClick={() => setDecision("REVISION")} icon={<RotateCcw size={18} />} label="Minta Perbaikan" color="amber" />
      <DecisionButton active={decision === "REJECT"} onClick={() => setDecision("REJECT")} icon={<XCircle size={18} />} label="Tolak" color="red" />
    </div>
    <label className="mt-5 block text-sm font-bold text-[#073B4C]">Catatan {decision !== "APPROVE" && "*"}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder={decision === "APPROVE" ? "Catatan opsional untuk pelaku usaha" : "Jelaskan data yang harus diperbaiki atau alasan penolakan"} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0FA3B1]" /></label>
    {feedback && <p role="status" className={`mt-4 rounded-xl p-3 text-sm font-semibold ${feedback.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{feedback.message}</p>}
    <div className="mt-5 flex justify-end"><button type="button" onClick={submit} disabled={submitting} className="min-h-11 rounded-xl bg-[#073B4C] px-6 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Memproses..." : "Simpan Keputusan"}</button></div>
  </section>;
}

function DecisionButton({ active, onClick, icon, label, color }: { readonly active: boolean; readonly onClick: () => void; readonly icon: React.ReactNode; readonly label: string; readonly color: "emerald" | "amber" | "red" }) {
  const activeClass = color === "emerald" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : color === "amber" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-red-400 bg-red-50 text-red-700";
  return <button type="button" onClick={onClick} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${active ? activeClass : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{icon}{label}</button>;
}
