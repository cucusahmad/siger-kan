"use client";

import { FileText, LoaderCircle, Upload } from "lucide-react";
import { useState } from "react";

export const managementCertificateTypes = ["ISO 9001", "HACCP", "ISO 22000", "Lainnya"] as const;
export type ManagementCertificateType = (typeof managementCertificateTypes)[number];
export interface ManagementCertificateDocument { readonly id: string; readonly originalFileName: string }
export interface ManagementCertificate { number: string; issueDate: string; validUntil: string; certificationBody: string; certificationBodyAddress: string; document: ManagementCertificateDocument | null }
export type ManagementCertificates = Record<ManagementCertificateType, ManagementCertificate>;

export const defaultManagementCertificates = Object.fromEntries(managementCertificateTypes.map((type) => [type, { number: "", issueDate: "", validUntil: "", certificationBody: "", certificationBodyAddress: "", document: null }])) as ManagementCertificates;

interface Props { readonly applicationId: string; readonly value: ManagementCertificates; readonly disabled: boolean; readonly onChange: (value: ManagementCertificates) => void; readonly onNotice: (message: string) => void }
const inputClass = "min-w-44 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";
const rows = [{ key: "number", label: "Nomor", type: "text" }, { key: "issueDate", label: "Tanggal", type: "date" }, { key: "validUntil", label: "Berlaku sampai", type: "date" }, { key: "certificationBody", label: "Badan sertifikasi", type: "text" }, { key: "certificationBodyAddress", label: "Alamat badan sertifikasi", type: "text" }] as const;

export function ManagementCertificatesTable({ applicationId, value, disabled, onChange, onNotice }: Props) {
  const [uploadingType, setUploadingType] = useState<ManagementCertificateType | null>(null);
  function update(type: ManagementCertificateType, field: keyof ManagementCertificate, fieldValue: string | ManagementCertificateDocument | null) { onChange({ ...value, [type]: { ...value[type], [field]: fieldValue } }); }
  async function upload(type: ManagementCertificateType, file: File) {
    if (file.size > 10 * 1024 * 1024) { onNotice("Ukuran berkas maksimal 10 MB."); return; }
    setUploadingType(type);
    try {
      const formData = new FormData(); formData.set("file", file); formData.set("documentType", "OTHER"); formData.set("documentName", `Sertifikat ${type} - ${file.name}`);
      const response = await fetch(`/api/certification-applications/${applicationId}/documents`, { method: "POST", body: formData });
      const result = await response.json() as { success: boolean; message: string; data?: ManagementCertificateDocument };
      onNotice(result.message); if (result.success && result.data) update(type, "document", result.data);
    } finally { setUploadingType(null); }
  }
  return <fieldset className="md:col-span-2"><legend className="text-sm font-bold text-[#073B4C]">Sertifikat sistem manajemen</legend><p className="mt-1 text-xs text-slate-500">Isi data hanya untuk jenis sertifikat yang dimiliki.</p><div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-[#073B4C] text-white"><th scope="col" className="w-52 px-4 py-3 text-xs font-bold uppercase tracking-wide">Data sertifikat</th>{managementCertificateTypes.map((type) => <th scope="col" key={type} className="border-l border-white/15 px-4 py-3 text-sm font-bold">{type}</th>)}</tr></thead><tbody>
    {rows.map((row) => <tr key={row.key} className="border-t border-slate-200 align-top"><th scope="row" className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{row.label}</th>{managementCertificateTypes.map((certificateType) => <td key={certificateType} className="border-l border-slate-200 p-3"><input type={row.type} value={value[certificateType][row.key]} onChange={(event) => update(certificateType, row.key, event.target.value)} aria-label={`${row.label} ${certificateType}`} className={inputClass}/></td>)}</tr>)}
    <tr className="border-t border-slate-200 align-top"><th scope="row" className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Berkas</th>{managementCertificateTypes.map((type) => { const document = value[type].document; const uploading = uploadingType === type; return <td key={type} className="border-l border-slate-200 p-3">{document && <div className="mb-2 flex items-center gap-2 text-xs text-slate-600"><FileText size={14}/><a className="max-w-40 truncate font-semibold text-[#087E8B] underline" href={`/api/certification-applications/${applicationId}/documents/${document.id}`} target="_blank" rel="noreferrer">{document.originalFileName}</a></div>}<label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#087E8B] px-3 py-2 text-xs font-bold text-[#087E8B] ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}>{uploading ? <LoaderCircle className="animate-spin" size={15}/> : <Upload size={15}/>} {document ? "Ganti berkas" : "Pilih berkas"}<input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={disabled || uploading} className="sr-only" aria-label={`Unggah berkas ${type}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(type, file); event.target.value = ""; }}/></label></td>; })}</tr>
  </tbody></table></div><p className="mt-2 text-xs text-slate-500">Format berkas PDF, JPG, atau PNG. Ukuran maksimal 10 MB.</p></fieldset>;
}
