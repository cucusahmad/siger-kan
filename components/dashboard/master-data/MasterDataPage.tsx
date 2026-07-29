"use client";

import { CheckCircle2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type { EditableMasterResource, MasterDataPayload, MasterRecord } from "@/features/master-data/master-data.types";

interface ResourceConfig {
  readonly title: string;
  readonly singular: string;
  readonly description: string;
}

const configs: Record<EditableMasterResource, ResourceConfig> = {
  commodities: { title: "Master Commodity", singular: "commodity", description: "Kelola komoditas perikanan yang menjadi dasar profil usaha dan katalog produk." },
  categories: { title: "Master Category", singular: "category", description: "Kelola pengelompokan produk untuk kebutuhan katalog dan business matching." },
  units: { title: "Master Unit", singular: "unit", description: "Kelola satuan standar yang digunakan pada data produk." },
};

interface FormValues {
  readonly code: string;
  readonly name: string;
  readonly scientificName: string;
  readonly symbol: string;
  readonly description: string;
  readonly parentId: string;
  readonly isActive: boolean;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: MasterDataPayload;
  readonly errors?: Record<string, readonly string[]>;
}

interface MasterDataPageProps {
  readonly resource: EditableMasterResource;
  readonly initialData: MasterDataPayload;
}

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";

function defaultValues(item?: MasterRecord): FormValues {
  return {
    code: item?.code ?? "", name: item?.name ?? "", scientificName: item?.scientificName ?? "",
    symbol: item?.symbol ?? "", description: item?.description ?? "", parentId: item?.parentId ?? "",
    isActive: item?.isActive ?? true,
  };
}

export function MasterDataPage({ resource, initialData }: MasterDataPageProps) {
  const config = configs[resource];
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<MasterRecord | null>(null);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly message: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: defaultValues() });

  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    if (!needle) return data.records;
    return data.records.filter((item) => [item.code, item.name, item.scientificName, item.symbol, item.parentName].some((value) => value?.toLocaleLowerCase("id").includes(needle)));
  }, [data.records, query]);

  const openForm = (item?: MasterRecord) => {
    setFeedback(null);
    setEditing(item ?? null);
    reset(defaultValues(item));
  };

  const submit = async (values: FormValues) => {
    setFeedback(null);
    const endpoint = editing ? `/api/master-data/${resource}/${editing.id}` : `/api/master-data/${resource}`;
    const response = await fetch(endpoint, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json() as ApiResponse;
    if (!result.success) {
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        const message = messages[0];
        if (message && field in values) setError(field as keyof FormValues, { message });
      });
      setFeedback({ kind: "error", message: result.message });
      return;
    }
    if (result.data) setData(result.data);
    setEditing(undefined);
    setFeedback({ kind: "success", message: result.message });
  };

  const remove = async () => {
    if (!deleting) return;
    const response = await fetch(`/api/master-data/${resource}/${deleting.id}`, { method: "DELETE" });
    const result = await response.json() as ApiResponse;
    if (result.success && result.data) {
      setData(result.data);
      setDeleting(null);
      setFeedback({ kind: "success", message: result.message });
    } else {
      setDeleting(null);
      setFeedback({ kind: "error", message: result.message });
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Business Matching · Master Data</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{config.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{config.description}</p></div>
          <button type="button" onClick={() => openForm()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0FA3B1] px-5 text-sm font-bold text-white transition hover:bg-[#087E8B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Plus size={18} /> Tambah {config.singular}</button>
        </div>
      </section>

      {feedback && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 size={18} />{feedback.message}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold text-[#073B4C]">Daftar {config.singular}</h2><p className="mt-1 text-xs text-slate-500">{data.records.length} data tersimpan</p></div>
          <label className="relative w-full sm:max-w-xs"><span className="sr-only">Cari data</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode atau nama..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#0FA3B1]" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Kode</th><th className="px-5 py-3.5">Nama</th>{resource === "categories" && <th className="px-5 py-3.5">Kategori Induk</th>}<th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRecords.map((item) => <tr key={item.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 font-mono text-xs font-bold text-[#087E8B]">{item.code}</td><td className="px-5 py-4"><strong className="block text-[#073B4C]">{item.name}</strong><span className="mt-1 block text-xs text-slate-500">{item.scientificName ?? item.symbol ?? item.description ?? "—"}</span></td>{resource === "categories" && <td className="px-5 py-4 text-xs text-slate-600">{item.parentName ?? "Kategori utama"}</td>}<td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openForm(item)} aria-label={`Edit ${item.name}`} className="rounded-lg border border-slate-200 p-2 text-[#087E8B] transition hover:bg-cyan-50"><Pencil size={16} /></button><button type="button" onClick={() => setDeleting(item)} aria-label={`Hapus ${item.name}`} className="rounded-lg border border-slate-200 p-2 text-[#E63946] transition hover:bg-red-50"><Trash2 size={16} /></button></div></td></tr>)}
              {visibleRecords.length === 0 && <tr><td colSpan={resource === "categories" ? 5 : 4} className="px-5 py-14 text-center text-slate-500">Data tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editing !== undefined && <div role="dialog" aria-modal="true" aria-labelledby="master-form-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6"><div><h2 id="master-form-title" className="text-lg font-bold text-[#073B4C]">{editing ? "Edit" : "Tambah"} {config.singular}</h2><p className="mt-1 text-xs text-slate-500">Isi data dengan lengkap dan benar.</p></div><button type="button" onClick={() => setEditing(undefined)} aria-label="Tutup formulir" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><form onSubmit={handleSubmit(submit)} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <Field label="Kode" error={errors.code?.message}><input {...register("code", { required: "Kode wajib diisi." })} className={inputClass} /></Field>
        <Field label="Nama" error={errors.name?.message}><input {...register("name", { required: "Nama wajib diisi." })} className={inputClass} /></Field>
        {resource === "commodities" && <Field label="Nama ilmiah" error={errors.scientificName?.message}><input {...register("scientificName")} className={inputClass} /></Field>}
        {resource === "units" && <Field label="Simbol" error={errors.symbol?.message}><input {...register("symbol", { required: "Simbol wajib diisi." })} className={inputClass} /></Field>}
        {resource === "categories" && <SelectField label="Kategori induk" name="parentId" register={register} error={errors.parentId?.message} options={data.options.categories.filter((option) => option.id !== editing?.id)} />}
        {resource !== "commodities" && <label className="sm:col-span-2 text-sm font-bold text-[#073B4C]">Deskripsi<textarea {...register("description")} rows={3} className={`${inputClass} py-3`} /></label>}
        <label className="flex items-center gap-3 text-sm font-bold text-[#073B4C] sm:col-span-2"><input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-[#087E8B]" /> Data aktif</label>
        {feedback?.kind === "error" && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{feedback.message}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={() => setEditing(undefined)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Batal</button><button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? "Menyimpan..." : "Simpan Data"}</button></div>
      </form></div></div>}

      {deleting && <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-[#073B4C]">Hapus {config.singular}?</h2><p className="mt-2 text-sm leading-6 text-slate-600"><strong>{deleting.name}</strong> akan dihapus dari daftar aktif. Riwayat audit tetap disimpan.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleting(null)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold">Batal</button><button type="button" onClick={remove} className="min-h-11 rounded-xl bg-[#E63946] px-5 text-sm font-bold text-white">Hapus</button></div></div></div>}
    </div>
  );
}

interface FieldProps { readonly label: string; readonly error?: string; readonly children: React.ReactNode }
function Field({ label, error, children }: FieldProps) { return <label className="text-sm font-bold text-[#073B4C]">{label}{children}{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>; }

interface SelectFieldProps { readonly label: string; readonly name: "parentId"; readonly register: ReturnType<typeof useForm<FormValues>>["register"]; readonly error?: string; readonly options: readonly { readonly id: string; readonly label: string }[] }
function SelectField({ label, name, register, error, options }: SelectFieldProps) { return <Field label={label} error={error}><select {...register(name)} className={inputClass}><option value="">Tanpa induk (kategori utama)</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>; }
