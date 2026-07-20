"use client";

import { Download, Eye, FileText, LoaderCircle, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";

import { MAX_BUSINESS_DOCUMENT_SIZE_BYTES } from "@/lib/business-documents/document-constants";

export interface BusinessDocumentDto {
  readonly id: string;
  readonly documentType: string;
  readonly documentTypeLabel: string;
  readonly customTitle: string | null;
  readonly documentNumber: string | null;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: string;
  readonly issuedAt: string | null;
  readonly expiresAt: string | null;
  readonly verificationStatus: string;
  readonly verificationNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly canReplace: boolean;
  readonly canDelete: boolean;
  readonly fileAvailable: boolean;
}

interface Props {
  readonly documents: readonly BusinessDocumentDto[];
  readonly canManage: boolean;
  readonly allowCreate?: boolean;
  readonly onChanged: () => Promise<void>;
  readonly onFeedback: (kind: "success" | "error", text: string) => void;
}

interface FormValues {
  readonly documentType: string;
  readonly customTitle: string;
  readonly documentNumber: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly file: FileList;
}

const documentTypes = [
  ["NIB", "Nomor Induk Berusaha"], ["TAX_ID", "NPWP"], ["BUSINESS_LICENSE", "SIUP / Izin Usaha"],
  ["PIRT", "PIRT"], ["HALAL_CERTIFICATE", "Sertifikat Halal"], ["QUALITY_CERTIFICATE", "Sertifikat Mutu"],
  ["PIC_IDENTITY", "Identitas Penanggung Jawab"], ["OTHER", "Dokumen Lainnya"],
] as const;
const statusLabels: Readonly<Record<string, string>> = { PENDING: "Menunggu Verifikasi", VERIFIED: "Disetujui", REJECTED: "Ditolak", EXPIRED: "Kedaluwarsa", UNVERIFIED: "Belum Diverifikasi" };
const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/10";

export function BusinessDocumentSection({ documents, canManage, allowCreate = canManage, onChanged, onFeedback }: Props) {
  const [open, setOpen] = useState(false);
  const [replaceDocument, setReplaceDocument] = useState<BusinessDocumentDto | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<BusinessDocumentDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, reset, setError, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: { documentType: "NIB", customTitle: "", documentNumber: "", issuedAt: "", expiresAt: "" } });
  const [documentType, selectedFiles] = useWatch({ control, name: ["documentType", "file"] });
  const selectedFile = selectedFiles?.item(0) ?? null;
  const fileRegistration = register("file", { required: "File wajib dipilih.", validate: {
    size: (files) => !files?.[0] || files[0].size <= MAX_BUSINESS_DOCUMENT_SIZE_BYTES || "Ukuran file maksimal 5 MB.",
    type: (files) => !files?.[0] || ["application/pdf", "image/jpeg", "image/png"].includes(files[0].type) || "Format file tidak didukung.",
  } });

  const closeForm = () => { if (isSubmitting) return; setOpen(false); setReplaceDocument(null); reset(); };
  const beginUpload = () => { reset({ documentType: "NIB", customTitle: "", documentNumber: "", issuedAt: "", expiresAt: "" }); setReplaceDocument(null); setOpen(true); };
  const beginReplace = (document: BusinessDocumentDto) => { reset({ documentType: document.documentType, customTitle: document.customTitle ?? "", documentNumber: document.documentNumber ?? "", issuedAt: document.issuedAt ?? "", expiresAt: document.expiresAt ?? "" }); setReplaceDocument(document); setOpen(true); };
  const submit = async (values: FormValues) => {
    const file = values.file?.item(0);
    if (!file) return;
    if (values.documentType === "OTHER" && !values.customTitle.trim()) { setError("customTitle", { message: "Judul dokumen wajib diisi untuk Dokumen Lainnya." }); return; }
    if (values.issuedAt && values.expiresAt && values.expiresAt < values.issuedAt) { setError("expiresAt", { message: "Tanggal berlaku tidak boleh lebih awal dari tanggal terbit." }); return; }
    const body = new FormData();
    body.set("file", file); body.set("documentType", values.documentType); body.set("customTitle", values.customTitle);
    body.set("documentNumber", values.documentNumber); body.set("issuedAt", values.issuedAt); body.set("expiresAt", values.expiresAt);
    try {
      const url = replaceDocument ? `/api/business/documents/${replaceDocument.id}/replace` : "/api/business/documents";
      const response = await fetch(url, { method: "POST", body });
      const result = await response.json() as { readonly success: boolean; readonly message: string; readonly errors?: Readonly<Record<string, readonly string[]>> };
      if (!response.ok) {
        for (const [field, messages] of Object.entries(result.errors ?? {})) { const message = messages[0]; if (message && field in values) setError(field as keyof FormValues, { message }); }
        onFeedback("error", result.message || "Dokumen gagal disimpan."); return;
      }
      setOpen(false);
      setReplaceDocument(null);
      reset({ documentType: "NIB", customTitle: "", documentNumber: "", issuedAt: "", expiresAt: "" });
      await onChanged();
      onFeedback("success", result.message || "Dokumen berhasil diunggah.");
    } catch { onFeedback("error", "Koneksi ke server bermasalah. Dokumen belum disimpan."); }
  };
  const confirmDelete = async () => {
    if (!deleteDocument || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/business/documents/${deleteDocument.id}`, { method: "DELETE" });
      const result = await response.json() as { readonly message: string };
      if (!response.ok) { onFeedback("error", result.message || "Dokumen gagal dihapus."); return; }
      setDeleteDocument(null); await onChanged(); onFeedback("success", result.message);
    } catch { onFeedback("error", "Koneksi ke server bermasalah. Dokumen belum dihapus."); }
    finally { setDeleting(false); }
  };

  return <>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-navy">Dokumen Pendukung</h2><p className="mt-1 text-sm leading-6 text-muted">Berkas disimpan secara privat dan hanya dapat diakses oleh pengguna yang berwenang.</p></div>{allowCreate && <button type="button" onClick={beginUpload} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ocean px-4 text-sm font-bold text-white transition hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"><Plus className="h-4 w-4" />Unggah Dokumen</button>}</div>
    {documents.length ? <div className="mt-5 grid gap-4 xl:grid-cols-2">{documents.map((document) => <DocumentCard key={document.id} document={document} onReplace={() => beginReplace(document)} onDelete={() => setDeleteDocument(document)} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><FileText className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm font-bold text-navy">Belum ada dokumen pendukung</p><p className="mt-1 text-xs text-muted">Unggah NIB dan NPWP untuk melengkapi profil usaha.</p></div>}
    {open && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="document-dialog-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h3 id="document-dialog-title" className="text-xl font-bold text-navy">{replaceDocument ? "Ganti File Dokumen" : "Unggah Dokumen"}</h3><p className="mt-1 text-sm text-muted">Format PDF, JPG, atau PNG. Maksimal 5 MB.</p></div><button type="button" onClick={closeForm} aria-label="Tutup dialog" className="rounded-lg p-2 text-muted hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-ocean"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit(submit)} noValidate className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-navy">Jenis Dokumen<select {...register("documentType")} className={`${inputClass} mt-2`}>{documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{documentType === "OTHER" && <Field label="Judul Dokumen *" error={errors.customTitle?.message} input={<input {...register("customTitle")} className={`${inputClass} mt-2`} aria-invalid={Boolean(errors.customTitle)} />} />}<Field label="Nomor Dokumen" error={errors.documentNumber?.message} input={<input {...register("documentNumber")} className={`${inputClass} mt-2`} />} /><Field label="Tanggal Terbit" error={errors.issuedAt?.message} input={<input type="date" max={new Date().toLocaleDateString("sv-SE")} {...register("issuedAt")} className={`${inputClass} mt-2`} />} /><Field label="Berlaku Sampai" error={errors.expiresAt?.message} input={<input type="date" {...register("expiresAt")} className={`${inputClass} mt-2`} />} /><div className="sm:col-span-2"><label htmlFor="business-document-file" className="block text-sm font-semibold text-navy">File *</label><p id="business-document-help" className="mt-1 text-xs text-muted">Format PDF, JPG, atau PNG. Maksimal 5 MB.</p><input id="business-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" {...fileRegistration} ref={(element) => { fileRegistration.ref(element); fileInputRef.current = element; }} aria-describedby={`business-document-help${errors.file ? " business-document-error" : ""}`} aria-invalid={Boolean(errors.file)} className="mt-3 block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-seafoam file:px-3 file:py-2 file:font-bold file:text-ocean focus-visible:outline-2 focus-visible:outline-ocean" />{selectedFile && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="min-w-0 truncate text-navy">{selectedFile.name} · {formatFileSize(selectedFile.size)}</span><button type="button" onClick={() => { setValue("file", new DataTransfer().files); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="shrink-0 font-bold text-[#C72F3B]">Hapus pilihan</button></div>}{errors.file?.message && <p id="business-document-error" role="alert" className="mt-2 text-xs font-medium text-[#C72F3B]">{errors.file.message}</p>}</div><div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" disabled={isSubmitting} onClick={closeForm} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy disabled:opacity-50">Batal</button><button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ocean px-5 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{isSubmitting ? "Menyimpan..." : replaceDocument ? "Ganti File" : "Unggah Dokumen"}</button></div></form></div></div>, document.body)}
    {deleteDocument && <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/55 p-4 backdrop-blur-sm"><div role="alertdialog" aria-modal="true" aria-labelledby="delete-document-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h3 id="delete-document-title" className="text-lg font-bold text-navy">Hapus dokumen?</h3><p className="mt-2 text-sm leading-6 text-muted">{deleteDocument.documentTypeLabel} akan dihapus dari profil usaha. Tindakan ini tidak dapat dibatalkan dari halaman ini.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={deleting} onClick={() => setDeleteDocument(null)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy">Batal</button><button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E63946] px-4 text-sm font-bold text-white disabled:opacity-60">{deleting && <LoaderCircle className="h-4 w-4 animate-spin" />}Hapus</button></div></div></div>}
  </>;
}

function DocumentCard({ document, onReplace, onDelete }: { readonly document: BusinessDocumentDto; readonly onReplace: () => void; readonly onDelete: () => void }) {
  const expired = Boolean(document.expiresAt && document.expiresAt < new Date().toLocaleDateString("sv-SE"));
  return <article className="min-w-0 rounded-2xl border border-slate-200 p-4"><div className="flex items-start gap-3"><div className="rounded-xl bg-seafoam p-2.5"><FileText className="h-5 w-5 text-ocean" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-bold text-navy">{document.customTitle || document.documentTypeLabel}</h3>{document.customTitle && <p className="mt-0.5 text-xs text-muted">{document.documentTypeLabel}</p>}</div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-navy">{statusLabels[document.verificationStatus] ?? document.verificationStatus}</span></div><p className="mt-3 break-all text-sm text-muted">{document.originalFileName} · {formatFileSize(Number(document.fileSizeBytes))}</p><dl className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">{document.documentNumber && <div><dt className="font-semibold text-navy">Nomor Dokumen</dt><dd className="mt-0.5 break-words">{document.documentNumber}</dd></div>}<div><dt className="font-semibold text-navy">Tanggal Unggah</dt><dd className="mt-0.5">{formatDate(document.createdAt)}</dd></div>{document.issuedAt && <div><dt className="font-semibold text-navy">Tanggal Terbit</dt><dd className="mt-0.5">{formatDate(document.issuedAt)}</dd></div>}<div><dt className="font-semibold text-navy">Berlaku Sampai</dt><dd className={`mt-0.5 ${expired ? "font-bold text-[#C72F3B]" : ""}`}>{document.expiresAt ? `${formatDate(document.expiresAt)}${expired ? " · Kedaluwarsa" : ""}` : "Tidak Ada Masa Berlaku"}</dd></div></dl>{document.verificationStatus === "REJECTED" && document.verificationNotes && <p className="mt-3 rounded-xl bg-[#FFF4F5] p-3 text-xs text-[#C72F3B]">Catatan: {document.verificationNotes}</p>}{!document.fileAvailable && <p role="status" className="mt-3 text-xs font-bold text-[#C72F3B]">File tidak tersedia</p>}</div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">{document.fileAvailable && <><a target="_blank" rel="noreferrer" href={`/api/business/documents/${document.id}/view`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-navy"><Eye className="h-3.5 w-3.5" />Lihat</a><a href={`/api/business/documents/${document.id}/download`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-navy"><Download className="h-3.5 w-3.5" />Unduh</a></>}{document.canReplace && <button type="button" onClick={onReplace} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-navy"><Pencil className="h-3.5 w-3.5" />Ganti File</button>}{document.canDelete && <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#E63946]/20 px-3 text-xs font-bold text-[#C72F3B]"><Trash2 className="h-3.5 w-3.5" />Hapus</button>}</div></article>;
}

function Field({ label, error, input }: { readonly label: string; readonly error?: string; readonly input: React.ReactNode }) { return <label className="text-sm font-semibold text-navy">{label}{input}{error && <span role="alert" className="mt-1.5 block text-xs font-medium text-[#C72F3B]">{error}</span>}</label>; }
function formatFileSize(bytes: number): string { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)); }
