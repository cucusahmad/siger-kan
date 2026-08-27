"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileBadge2, Pencil, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { pastCertificationSchema, type PastCertificationInput, type PastCertificationView } from "@/features/past-certifications/past-certification.schema";

interface PastCertificationsPageProps {
  readonly initialRecords: readonly PastCertificationView[];
  readonly canManage: boolean;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: PastCertificationView;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

const statusLabels: Readonly<Record<PastCertificationView["certificationStatus"], string>> = {
  BERLAKU: "Berlaku", KEDALUWARSA: "Kedaluwarsa", DICABUT: "Dicabut", LAINNYA: "Lainnya",
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#087E8B] focus:ring-2 focus:ring-[#087E8B]/15";

export function PastCertificationsPage({ initialRecords, canManage }: PastCertificationsPageProps) {
  const [records, setRecords] = useState(initialRecords);
  const [isFormOpen, setIsFormOpen] = useState(initialRecords.length === 0 && canManage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<PastCertificationInput>({
    resolver: zodResolver(pastCertificationSchema),
    defaultValues: { productName: "", sniNumber: "", spptSniNumber: "", skpNumber: "", spptIssuedAt: "", spptExpiresAt: "", certificationStatus: "BERLAKU", notes: "" },
  });

  async function submit(values: PastCertificationInput) {
    setNotice("");
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.set(key, value));
    if (document) form.set("document", document);
    const response = await fetch(editingId ? `/api/past-certifications/${editingId}` : "/api/past-certifications", { method: editingId ? "PATCH" : "POST", body: form });
    const result = await response.json() as ApiResponse;
    if (!result.success || !result.data) {
      Object.entries(result.errors ?? {}).forEach(([name, messages]) => {
        if (name in values && messages[0]) setError(name as keyof PastCertificationInput, { message: messages[0] });
      });
      setNotice(result.message);
      return;
    }
    setRecords((current) => editingId ? current.map((record) => record.id === editingId ? result.data as PastCertificationView : record) : [result.data as PastCertificationView, ...current]);
    closeForm();
    setNotice(result.message);
  }

  function openCreateForm() { setEditingId(null); reset(); setDocument(null); setNotice(""); setIsFormOpen(true); }
  function closeForm() { setEditingId(null); reset(); setDocument(null); setIsFormOpen(false); }
  function openEditForm(record: PastCertificationView) {
    setEditingId(record.id);
    reset({ productName: record.productName, sniNumber: record.sniNumber, spptSniNumber: record.spptSniNumber, skpNumber: record.skpNumber, spptIssuedAt: record.spptIssuedAt, spptExpiresAt: record.spptExpiresAt, certificationStatus: record.certificationStatus, notes: record.notes });
    setDocument(null); setNotice(""); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(record: PastCertificationView) {
    if (!window.confirm(`Hapus sertifikasi untuk ${record.productName}? Data yang dihapus tidak akan tampil kembali.`)) return;
    setDeletingId(record.id); setNotice("");
    try {
      const response = await fetch(`/api/past-certifications/${record.id}`, { method: "DELETE" });
      const result = await response.json() as ApiResponse;
      if (!result.success) { setNotice(result.message); return; }
      setRecords((current) => current.filter((item) => item.id !== record.id));
      if (editingId === record.id) closeForm();
      setNotice(result.message);
    } finally { setDeletingId(null); }
  }

  return <div className="space-y-6">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#073B4C] to-[#087E8B] p-6 text-white shadow-lg shadow-[#073B4C]/10 sm:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="max-w-2xl"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck aria-hidden="true" size={24}/></div><h1 className="text-2xl font-bold sm:text-3xl">Daftar Sertifikasi Lampau</h1><p className="mt-2 text-sm leading-6 text-cyan-50">Catat sertifikasi yang pernah diperoleh di luar alur permohonan SIGER-KAN. Data tersimpan sebagai riwayat usaha dan tidak menjadi permohonan baru.</p></div>
        {canManage && <button type="button" onClick={isFormOpen ? closeForm : openCreateForm} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#073B4C] shadow-sm"><Plus size={18}/>{isFormOpen ? "Tutup Form" : "Tambah Sertifikasi"}</button>}
      </div>
    </header>

    {notice && <div role="status" className="rounded-xl border border-[#087E8B]/20 bg-[#087E8B]/5 px-4 py-3 text-sm font-medium text-[#073B4C]">{notice}</div>}

    {isFormOpen && <form onSubmit={handleSubmit(submit)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6"><h2 className="text-lg font-bold text-[#073B4C]">{editingId ? "Edit sertifikasi" : "Informasi sertifikasi"}</h2><p className="mt-1 text-sm text-slate-500">Kolom bertanda bintang wajib diisi. Isi minimal salah satu nomor sertifikasi.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nama Produk" required error={errors.productName?.message}><input className={inputClass} {...register("productName")} placeholder="Contoh: Pempek Ikan Tenggiri"/></Field>
        <Field label="Status Sertifikasi" required error={errors.certificationStatus?.message}><select className={inputClass} {...register("certificationStatus")}><option value="BERLAKU">Berlaku</option><option value="KEDALUWARSA">Kedaluwarsa</option><option value="DICABUT">Dicabut</option><option value="LAINNYA">Lainnya</option></select></Field>
        <Field label="Nomor SNI" error={errors.sniNumber?.message}><input className={inputClass} {...register("sniNumber")} placeholder="Contoh: SNI 7661.1:2019"/></Field>
        <Field label="Nomor SPPT SNI" error={errors.spptSniNumber?.message}><input className={inputClass} {...register("spptSniNumber")} placeholder="Masukkan nomor SPPT SNI"/></Field>
        <Field label="Nomor SKP" error={errors.skpNumber?.message}><input className={inputClass} {...register("skpNumber")} placeholder="Masukkan nomor SKP"/></Field>
        <div className="hidden md:block"/>
        <Field label="Tanggal Terbit SPPT" error={errors.spptIssuedAt?.message}><input type="date" className={inputClass} {...register("spptIssuedAt")}/></Field>
        <Field label="Tanggal Berakhir SPPT" error={errors.spptExpiresAt?.message}><input type="date" className={inputClass} {...register("spptExpiresAt")}/></Field>
        <Field label="Dokumen Sertifikasi" hint={editingId ? "Biarkan kosong untuk mempertahankan dokumen lama." : "PDF, JPG, atau PNG; maksimal 10 MB."}><label className={`${inputClass} flex cursor-pointer items-center gap-3 border-dashed`}><Upload size={18} className="text-[#087E8B]"/><span className="truncate">{document?.name ?? "Pilih dokumen"}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => setDocument(event.target.files?.[0] ?? null)}/></label></Field>
        <Field label="Keterangan" error={errors.notes?.message}><textarea rows={4} className={inputClass} {...register("notes")} placeholder="Informasi tambahan mengenai sertifikasi"/></Field>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Batal</button><button disabled={isSubmitting} className="rounded-xl bg-[#087E8B] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Sertifikasi"}</button></div>
    </form>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-bold text-[#073B4C]">Sertifikasi yang Pernah Diperoleh</h2><p className="mt-1 text-sm text-slate-500">{records.length} data sertifikasi tercatat</p></div>
      {records.length === 0 ? <div className="px-6 py-14 text-center"><FileBadge2 size={36} className="mx-auto text-slate-300"/><p className="mt-3 font-semibold text-slate-700">Belum ada sertifikasi lampau</p><p className="mt-1 text-sm text-slate-500">Tambahkan sertifikasi pertama untuk melengkapi riwayat usaha.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Produk</th><th className="px-5 py-3">Nomor Sertifikasi</th><th className="px-5 py-3">Masa Berlaku SPPT</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Dokumen</th>{canManage && <th className="px-5 py-3 text-right">Aksi</th>}</tr></thead><tbody className="divide-y divide-slate-100">{records.map((record) => <tr key={record.id} className="align-top hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{record.productName}</p>{record.notes && <p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={record.notes}>{record.notes}</p>}</td><td className="space-y-1 px-5 py-4 text-xs text-slate-600"><Identifier label="SNI" value={record.sniNumber}/><Identifier label="SPPT" value={record.spptSniNumber}/><Identifier label="SKP" value={record.skpNumber}/></td><td className="px-5 py-4 text-slate-600">{formatDate(record.spptIssuedAt)}<span className="mx-1 text-slate-300">–</span>{formatDate(record.spptExpiresAt)}</td><td className="px-5 py-4"><StatusBadge status={record.certificationStatus}/></td><td className="px-5 py-4">{record.documentName ? <a href={`/api/past-certifications/${record.id}/document`} className="inline-flex max-w-48 items-center gap-2 font-semibold text-[#087E8B] hover:underline"><Download size={16}/><span className="truncate">{record.documentName}</span></a> : <span className="text-slate-400">Tidak ada</span>}</td>{canManage && <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEditForm(record)} aria-label={`Edit sertifikasi ${record.productName}`} className="rounded-lg border border-slate-200 p-2 text-[#087E8B] hover:bg-cyan-50"><Pencil size={16}/></button><button type="button" disabled={deletingId === record.id} onClick={() => void remove(record)} aria-label={`Hapus sertifikasi ${record.productName}`} className="rounded-lg border border-red-100 p-2 text-[#E63946] hover:bg-red-50 disabled:opacity-50"><Trash2 size={16}/></button></div></td>}</tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Field({ label, required = false, error, hint, children }: Readonly<{ label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }>) { return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-[#E63946]"> *</span>}{children}{hint && !error && <span className="mt-1.5 block text-xs font-normal text-slate-500">{hint}</span>}{error && <span role="alert" className="mt-1.5 block text-xs font-normal text-[#E63946]">{error}</span>}</label>; }
function Identifier({ label, value }: Readonly<{ label: string; value: string }>) { return value ? <p><span className="font-semibold text-slate-700">{label}:</span> {value}</p> : null; }
function formatDate(value: string): string { return value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "-"; }
function StatusBadge({ status }: Readonly<{ status: PastCertificationView["certificationStatus"] }>) { const classes = status === "BERLAKU" ? "bg-emerald-50 text-emerald-700" : status === "KEDALUWARSA" ? "bg-amber-50 text-amber-700" : status === "DICABUT" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{statusLabels[status]}</span>; }
