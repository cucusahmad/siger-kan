"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FinalLaboratoryReportForm({ reportId }: { readonly reportId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) { setMessage("Pilih dokumen final LHU dalam format PDF."); return; }
    setPending(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/laboratory-reports/${reportId}/final-file`, { method: "POST", body: form });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message); if (result.success) { router.refresh(); return; }
    } catch { setMessage("Dokumen final belum dapat diunggah. Silakan coba kembali."); }
    setPending(false);
  }
  return <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Dokumen final LHU (PDF, maks. 5 MB)<input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-slate-200 p-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-semibold file:text-[#087E8B]" /></label>{message && <p role="status" className="text-sm text-[#087E8B]">{message}</p>}<button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073B4C] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <FileUp size={18} />} Unggah dan Terbitkan LHU</button></form>;
}
