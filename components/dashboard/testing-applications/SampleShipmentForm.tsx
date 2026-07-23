"use client";

import { FileText, ImageIcon, LoaderCircle, PackageCheck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

interface SampleShipmentFormProps {
  readonly applicationId: string;
}

export function SampleShipmentForm({ applicationId }: SampleShipmentFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<readonly File[]>([]);

  function handleEvidenceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const oversizedFile = files.find((file) => file.size > MAX_EVIDENCE_SIZE);
    let validationMessage = "";

    if (files.length > MAX_EVIDENCE_FILES) {
      validationMessage = "Pilih maksimal 5 file.";
    } else if (oversizedFile) {
      validationMessage = `${oversizedFile.name} melebihi batas ukuran 5 MB.`;
    }

    event.target.setCustomValidity(validationMessage);
    setEvidenceFiles(files);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/testing-applications/${applicationId}/sample-shipment`, {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { readonly success: boolean; readonly message: string };
      setMessage(result.message);
      if (result.success) router.refresh();
    } catch {
      setMessage("Berita pengiriman gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <PackageCheck className="text-violet-700" />
        <div>
          <h2 className="font-bold text-[#073B4C]">Berita Pengiriman Sampel</h2>
          <p className="mt-1 text-sm text-slate-500">Isi setelah sampel fisik diserahkan kepada kurir atau diantar ke laboratorium.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal pengiriman"><input required type="date" name="shippingDate" max={new Date().toISOString().slice(0, 10)} className="input" /></Field>
        <Field label="Metode pengiriman"><select required name="shippingMethod" className="input"><option value="EKSPEDISI">Jasa ekspedisi</option><option value="DIANTAR_LANGSUNG">Diantar langsung</option></select></Field>
        <Field label="Nama ekspedisi/pengantar"><input name="carrierName" maxLength={160} className="input" /></Field>
        <Field label="Nomor resi"><input name="trackingNumber" maxLength={120} className="input" /></Field>
        <Field label="Jumlah kemasan"><input required type="number" min={1} max={1000} name="packageCount" className="input" /></Field>
        <Field label="Nama pengirim"><input required name="senderName" minLength={2} maxLength={160} className="input" /></Field>
      </div>

      <Field label="Kondisi sampel saat dikirim"><textarea name="conditionNotes" rows={3} maxLength={3000} className="input" /></Field>

      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="shipment-evidence" className="text-sm font-semibold text-slate-700">
            Foto atau bukti kirim <span className="font-normal text-slate-500">(1–5 file)</span>
          </label>
          <span className="text-xs font-medium text-slate-500">{evidenceFiles.length}/5 file dipilih</span>
        </div>

        <label
          htmlFor="shipment-evidence"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#087E8B] hover:bg-cyan-50/50 focus-within:border-[#087E8B] focus-within:ring-2 focus-within:ring-cyan-100"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#087E8B] shadow-sm ring-1 ring-slate-200">
            <Upload size={19} aria-hidden="true" />
          </span>
          <span className="mt-3 text-sm font-semibold text-[#073B4C]">Pilih foto atau dokumen</span>
          <span className="mt-1 text-xs leading-5 text-slate-500">JPG, PNG, atau PDF · Maksimal 5 MB per file</span>
          <input
            id="shipment-evidence"
            required
            type="file"
            name="evidence"
            multiple
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleEvidenceChange}
            className="sr-only"
          />
        </label>

        {evidenceFiles.length > 0 && (
          <ul className="mt-3 grid gap-2" aria-label="File bukti yang dipilih">
            {evidenceFiles.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#087E8B]">
                  {file.type === "application/pdf" ? <FileText size={17} aria-hidden="true" /> : <ImageIcon size={17} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-700" title={file.name}>{file.name}</span>
                  <span className="block text-xs text-slate-500">{formatFileSize(file.size)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p role="status" className="mt-4 rounded-xl bg-cyan-50 p-3 text-sm">{message}</p>}
      <button disabled={submitting} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073B4C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
        {submitting && <LoaderCircle size={17} className="animate-spin" />} Kirim Berita Pengiriman
      </button>
    </form>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="mt-4 block text-sm font-semibold text-slate-700">{label}{children}</label>;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
