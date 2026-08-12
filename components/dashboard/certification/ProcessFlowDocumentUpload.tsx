"use client";

import { useState } from "react";
import { FileText, FileUp, LoaderCircle } from "lucide-react";

export interface ProcessFlowDocument {
  readonly id: string;
  readonly name: string;
  readonly originalFileName: string;
}

interface Props {
  readonly applicationId: string;
  readonly value: ProcessFlowDocument | null;
  readonly disabled: boolean;
  readonly onChange: (value: ProcessFlowDocument) => void;
  readonly onNotice: (message: string) => void;
  readonly error?: string;
}

interface UploadedProcessFlowDocument {
  readonly id: string;
  readonly documentName: string;
  readonly originalFileName: string;
}

export function ProcessFlowDocumentUpload({ applicationId, value, disabled, onChange, onNotice, error }: Props) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    onNotice("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("documentType", "PRODUCTION_PROCESS");
      formData.set("documentName", `Alur lengkap produksi/pengolahan - ${file.name}`);
      const response = await fetch(`/api/certification-applications/${applicationId}/documents`, { method: "POST", body: formData });
      const result = await response.json() as { success: boolean; message: string; data?: UploadedProcessFlowDocument };
      if (result.success && result.data) {
        onChange({ id: result.data.id, name: result.data.documentName, originalFileName: result.data.originalFileName });
        onNotice("Diagram alur produksi/pengolahan berhasil diunggah.");
      } else onNotice(result.message);
    } catch {
      onNotice("Diagram alur produksi/pengolahan gagal diunggah. Silakan coba kembali.");
    } finally {
      setUploading(false);
    }
  }

  return <fieldset className="rounded-xl border border-slate-200 p-4 md:col-span-2">
    <legend className="px-1 text-sm font-semibold">Alur lengkap produksi/pengolahan dan diagram</legend>
    <p className="mt-1 text-xs text-slate-500">Unggah dokumen yang menjelaskan seluruh tahapan proses produksi atau pengolahan.</p>
    <div className={`mt-4 rounded-xl border border-dashed bg-cyan-50/40 p-4 ${error ? "border-[#E63946]" : "border-[#0FA3B1]"}`}>
      {value ? <div className="flex items-center gap-3"><FileText className="shrink-0 text-[#087E8B]" aria-hidden="true"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#073B4C]">{value.originalFileName}</p><p className="text-xs text-slate-500">Diagram alur produksi/pengolahan telah diunggah.</p></div><a href={`/api/certification-applications/${applicationId}/documents/${value.id}`} className="text-sm font-bold text-[#087E8B]">Lihat</a></div> : <p className="text-sm text-slate-600">Belum ada diagram yang diunggah.</p>}
      <label className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-[#073B4C] px-4 py-2.5 text-sm font-bold text-white ${(disabled || uploading) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        {uploading ? <LoaderCircle className="animate-spin" size={17}/> : <FileUp size={17}/>} {uploading ? "Mengunggah..." : value ? "Ganti diagram" : "Pilih file diagram"}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={disabled || uploading} className="sr-only" aria-label="Unggah diagram alur lengkap produksi atau pengolahan" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }}/>
      </label>
      <p className="mt-2 text-xs text-slate-500">Format PDF, JPG, atau PNG. Ukuran maksimal 10 MB.</p>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-[#E63946]">{error}</p>}
    </div>
  </fieldset>;
}
