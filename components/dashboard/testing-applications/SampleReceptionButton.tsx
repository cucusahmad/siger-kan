"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SampleReceptionButton({ applicationId }: { readonly applicationId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function receive() {
    if (!window.confirm("Pastikan sampel fisik sudah diterima dan sesuai dengan bukti pengiriman.")) return;
    setSubmitting(true); setMessage("");
    try {
      const response = await fetch(`/api/testing-applications/${applicationId}/sample-reception`, { method: "POST" });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) router.refresh();
    } catch { setMessage("Konfirmasi penerimaan sampel gagal. Silakan coba kembali."); }
    finally { setSubmitting(false); }
  }

  return <div><button type="button" onClick={() => void receive()} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E9F6B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? <LoaderCircle size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} Sampel Diterima</button>{message && <p role="status" className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm text-[#073B4C]">{message}</p>}</div>;
}
