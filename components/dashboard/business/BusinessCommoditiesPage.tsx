"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Fish, LoaderCircle, PackageSearch, Save, Search, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { businessCommoditiesSchema, type BusinessCommoditiesInput } from "@/lib/business-commodities/commodity-schema";
import type { BusinessCommoditiesData } from "@/lib/business-commodities/commodity-service";

interface Props { readonly initialData: BusinessCommoditiesData; }
interface ApiResponse { readonly success: boolean; readonly message: string; readonly data?: BusinessCommoditiesData; }

const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function toFormValues(data: BusinessCommoditiesData): BusinessCommoditiesInput {
  const primary = data.commodities.find(({ priority }) => priority === "PRIMARY");
  return {
    primaryCommodityId: primary?.id ?? "",
    secondaryCommodityIds: data.commodities.filter(({ priority }) => priority === "SECONDARY").map(({ id }) => id),
    otherDescriptions: Object.fromEntries(data.commodities.filter(({ isOther, priority }) => isOther && priority).map(({ id, otherDescription }) => [id, otherDescription])),
  };
}

export function BusinessCommoditiesPage({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ readonly kind: "success" | "error"; readonly text: string } | null>(null);
  const { control, register, handleSubmit, setValue, reset, formState: { errors, isDirty, isSubmitting } } = useForm<BusinessCommoditiesInput>({ resolver: zodResolver(businessCommoditiesSchema), defaultValues: toFormValues(initialData), mode: "onTouched" });
  const primaryCommodityId = useWatch({ control, name: "primaryCommodityId" });
  const secondaryCommodityIds = useWatch({ control, name: "secondaryCommodityIds" }) ?? [];
  const otherDescriptions = useWatch({ control, name: "otherDescriptions" }) ?? {};
  const selectedIds = new Set([primaryCommodityId, ...secondaryCommodityIds].filter(Boolean));
  const visibleCommodities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    if (!query) return data.commodities;
    return data.commodities.filter(({ name, code, scientificName }) => [name, code, scientificName ?? ""].some((value) => value.toLocaleLowerCase("id-ID").includes(query)));
  }, [data.commodities, search]);

  const choosePrimary = (id: string) => {
    const previousPrimary = primaryCommodityId;
    setValue("primaryCommodityId", id, { shouldDirty: true, shouldValidate: true });
    setValue("secondaryCommodityIds", [...secondaryCommodityIds.filter((value) => value !== id), ...(previousPrimary && previousPrimary !== id ? [previousPrimary] : [])], { shouldDirty: true, shouldValidate: true });
  };
  const toggleSecondary = (id: string) => {
    if (id === primaryCommodityId) return;
    setValue("secondaryCommodityIds", secondaryCommodityIds.includes(id) ? secondaryCommodityIds.filter((value) => value !== id) : [...secondaryCommodityIds, id], { shouldDirty: true, shouldValidate: true });
  };
  const removeCommodity = (id: string) => {
    if (id === primaryCommodityId) setValue("primaryCommodityId", "", { shouldDirty: true, shouldValidate: true });
    else setValue("secondaryCommodityIds", secondaryCommodityIds.filter((value) => value !== id), { shouldDirty: true, shouldValidate: true });
  };
  const onSubmit = async (values: BusinessCommoditiesInput) => {
    setMessage(null);
    try {
      const response = await fetch("/api/business/commodities", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as ApiResponse;
      if (!response.ok || !result.data) { setMessage({ kind: "error", text: result.message || "Komoditas usaha gagal disimpan." }); return; }
      setData(result.data); reset(toFormValues(result.data)); setMessage({ kind: "success", text: result.message }); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setMessage({ kind: "error", text: "Koneksi ke server bermasalah. Perubahan Anda belum disimpan." }); }
  };

  const selectedCommodities = data.commodities.filter(({ id }) => selectedIds.has(id)).sort((a, b) => (a.id === primaryCommodityId ? -1 : b.id === primaryCommodityId ? 1 : a.name.localeCompare(b.name, "id")));
  return <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
    <header className="overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-xl shadow-navy/10 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-aqua">Pelaku Usaha</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Komoditas Usaha</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Tentukan komoditas utama dan pendukung {data.businessName} untuk membantu pemetaan layanan mutu, sertifikasi, dan peluang kemitraan.</p></div><div className="grid min-w-64 grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{selectedIds.size}</strong><span className="text-xs text-white/70">Komoditas dipilih</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{primaryCommodityId ? 1 : 0}</strong><span className="text-xs text-white/70">Komoditas utama</span></div></div></div>
    </header>
    {message && <div role={message.kind === "error" ? "alert" : "status"} aria-live="polite" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${message.kind === "success" ? "border-[#2E9F6B]/25 bg-[#EAF8F1] text-[#217A51]" : "border-[#E63946]/20 bg-[#FFF4F5] text-[#C72F3B]"}`}>{message.kind === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{message.text}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(7,59,76,.04)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-navy">Komoditas Terpilih</h2><p className="mt-1 text-sm text-muted">Komoditas utama ditandai dengan bintang dan hanya dapat berjumlah satu.</p></div></div>
      {selectedCommodities.length === 0 ? <div className="mt-5 flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Fish className="h-7 w-7 text-ocean" /><p className="mt-3 text-sm font-bold text-navy">Belum ada komoditas dipilih</p><p className="mt-1 text-xs text-muted">Pilih minimal satu komoditas utama dari katalog di bawah.</p></div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{selectedCommodities.map((commodity) => <div key={commodity.id} className={`rounded-2xl border p-4 ${commodity.id === primaryCommodityId ? "border-gold/50 bg-[#FFF9E9]" : "border-slate-200 bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${commodity.id === primaryCommodityId ? "bg-gold/20 text-[#9A6A00]" : "bg-seafoam text-ocean"}`}>{commodity.id === primaryCommodityId ? <Star className="h-5 w-5 fill-current" /> : <Fish className="h-5 w-5" />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-navy">{commodity.name}</p><p className="mt-0.5 text-xs text-muted">{commodity.id === primaryCommodityId ? "Komoditas utama" : "Komoditas pendukung"}</p></div></div>{data.canEdit && <button type="button" onClick={() => removeCommodity(commodity.id)} aria-label={`Hapus ${commodity.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-[#E63946]"><X className="h-4 w-4" /></button>}</div>{commodity.isOther && <label className="mt-4 block text-xs font-bold text-navy">Keterangan komoditas *<input {...register(`otherDescriptions.${commodity.id}`)} disabled={!data.canEdit} placeholder="Tuliskan nama komoditas" className={`${inputClass} mt-2`} />{!otherDescriptions[commodity.id]?.trim() && <span className="mt-1 block text-xs font-medium text-[#C72F3B]">Keterangan wajib diisi.</span>}</label>}</div>)}</div>}
      {errors.primaryCommodityId && <p role="alert" className="mt-3 text-sm font-medium text-[#C72F3B]">Pilih satu komoditas utama.</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(7,59,76,.04)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold text-navy">Katalog Komoditas</h2><p className="mt-1 text-sm text-muted">Cari berdasarkan nama, nama ilmiah, atau kode komoditas.</p></div><label className="relative block w-full sm:max-w-sm"><span className="sr-only">Cari komoditas</span><Search className="pointer-events-none absolute left-3.5 top-3 h-5 w-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari komoditas..." className={`${inputClass} pl-11`} /></label></div>
      {visibleCommodities.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><PackageSearch className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-bold text-navy">Komoditas tidak ditemukan</p><button type="button" onClick={() => setSearch("")} className="mt-2 text-xs font-bold text-ocean hover:underline">Hapus pencarian</button></div> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleCommodities.map((commodity) => { const isPrimary = commodity.id === primaryCommodityId; const isSecondary = secondaryCommodityIds.includes(commodity.id); return <article key={commodity.id} className={`flex flex-col rounded-2xl border p-4 transition ${isPrimary ? "border-gold/50 bg-[#FFF9E9]" : isSecondary ? "border-ocean/35 bg-seafoam/35" : "border-slate-200 hover:border-ocean/30"}`}><div className="flex-1"><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">{commodity.code}</span>{isPrimary && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#8A6500]"><Star className="h-3 w-3 fill-current" /> Utama</span>}</div><h3 className="mt-3 text-sm font-bold text-navy">{commodity.name}</h3><p className="mt-1 min-h-5 text-xs italic text-muted">{commodity.scientificName ?? "Nama ilmiah belum tersedia"}</p></div>{data.canEdit && <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => choosePrimary(commodity.id)} className={`min-h-9 rounded-lg px-2 text-xs font-bold transition ${isPrimary ? "bg-gold text-navy" : "border border-slate-200 text-navy hover:border-gold hover:bg-[#FFF9E9]"}`}>{isPrimary ? "Utama" : "Jadikan Utama"}</button><button type="button" disabled={isPrimary} onClick={() => toggleSecondary(commodity.id)} className={`min-h-9 rounded-lg px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${isSecondary ? "bg-ocean text-white" : "border border-slate-200 text-navy hover:border-ocean hover:bg-seafoam"}`}>{isSecondary ? "Pendukung ✓" : "Pilih Pendukung"}</button></div>}</article>; })}</div>}
    </section>
    {!data.canEdit && <div className="rounded-2xl border border-gold/30 bg-[#FFF9E9] p-4 text-sm text-navy">Anda memiliki akses lihat saja. Hubungi pemilik atau admin usaha untuk mengubah komoditas.</div>}
    {data.canEdit && <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><p className="hidden text-xs text-muted sm:block">{isDirty ? "Ada perubahan yang belum disimpan." : "Seluruh perubahan telah tersimpan."}</p><button type="submit" disabled={!isDirty || isSubmitting} className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-bold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSubmitting ? "Menyimpan..." : "Simpan Komoditas"}</button></div>}
  </form>;
}
