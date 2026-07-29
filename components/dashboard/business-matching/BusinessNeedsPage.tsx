"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarDays, CheckCircle2, CircleDollarSign, Eye, Mail, MapPin, MessageCircle, PackageSearch, Pencil, Plus, Search, Send, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { businessNeedInputSchema, type BusinessNeedInput } from "@/features/business-needs/business-need.schema";
import type { BusinessNeedPageData, BusinessNeedView, BusinessOpportunityView } from "@/features/business-needs/business-need.types";
import { businessOfferInputSchema, type BusinessOfferInput } from "@/features/business-offers/business-offer.schema";
import type { BusinessOfferView } from "@/features/business-offers/business-offer.types";

interface Props {
  readonly initialData: BusinessNeedPageData;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: BusinessNeedPageData | BusinessNeedView | null;
  readonly errors?: Record<string, readonly string[]>;
}

const defaults: BusinessNeedInput = {
  title: "", commodityId: "", categoryId: "", unitId: "", description: "", specifications: "",
  quantity: "", minimumBudget: "", maximumBudget: "", isBudgetNegotiable: false,
  deliveryLocation: "", requiredAt: "",
};
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";
const statusLabel: Record<BusinessNeedView["status"], string> = { DRAFT: "Draf", PUBLISHED: "Dipublikasikan", CLOSED: "Ditutup" };
const statusClass: Record<BusinessNeedView["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-600", PUBLISHED: "bg-emerald-50 text-emerald-700", CLOSED: "bg-amber-50 text-amber-700",
};

export function BusinessNeedsPage({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"OWN" | "MARKET" | "OFFERS">("OWN");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<BusinessOpportunityView | null>(null);
  const [editing, setEditing] = useState<BusinessNeedView | null | undefined>(undefined);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<BusinessNeedInput>({
    resolver: zodResolver(businessNeedInputSchema), defaultValues: defaults,
  });

  const needs = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return needle ? data.needs.filter((need) => [need.title, need.commodityName, need.categoryName, need.deliveryLocation].some((value) => value.toLocaleLowerCase("id").includes(needle))) : data.needs;
  }, [data.needs, query]);
  const opportunities = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return data.opportunities.filter((need) => {
      const matchesQuery = !needle || [need.title, need.commodityName, need.categoryName, need.deliveryLocation, need.businessName]
        .some((value) => value.toLocaleLowerCase("id").includes(needle));
      return matchesQuery && (!commodityFilter || need.commodityId === commodityFilter);
    });
  }, [commodityFilter, data.opportunities, query]);

  const reload = async () => {
    const response = await fetch("/api/business/needs");
    const result = await response.json() as ApiResponse;
    if (result.success && result.data && "needs" in result.data) setData(result.data);
  };

  const openForm = (need?: BusinessNeedView) => {
    setFeedback(null);
    setEditing(need ?? null);
    reset(need ? {
      title: need.title, commodityId: need.commodityId, categoryId: need.categoryId, unitId: need.unitId,
      description: need.description, specifications: need.specifications, quantity: need.quantity,
      minimumBudget: need.minimumBudget, maximumBudget: need.maximumBudget,
      isBudgetNegotiable: need.isBudgetNegotiable, deliveryLocation: need.deliveryLocation, requiredAt: need.requiredAt,
    } : defaults);
  };

  const save = async (input: BusinessNeedInput) => {
    const response = await fetch(editing ? `/api/business/needs/${editing.id}` : "/api/business/needs", {
      method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    const result = await response.json() as ApiResponse;
    if (!result.success) {
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        if (field in input && messages[0]) setError(field as keyof BusinessNeedInput, { message: messages[0] });
      });
      setFeedback({ kind: "error", message: result.message });
      return;
    }
    await reload();
    setEditing(undefined);
    setFeedback({ kind: "success", message: result.message });
  };

  const action = async (need: BusinessNeedView, value: "PUBLISH" | "CLOSE" | "REOPEN" | "DELETE") => {
    setBusyId(need.id);
    const response = await fetch(`/api/business/needs/${need.id}`, value === "DELETE"
      ? { method: "DELETE" }
      : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: value }) });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success) await reload();
  };

  const offerAction = async (offer: BusinessOfferView, value: "WITHDRAW" | "ACCEPT" | "REJECT") => {
    const notes = value === "WITHDRAW" ? "" : window.prompt(value === "ACCEPT" ? "Catatan penerimaan (opsional):" : "Alasan penolakan (opsional):") ?? "";
    setBusyId(offer.id);
    const response = await fetch(`/api/business/offers/${offer.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: value, notes }),
    });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success) await reload();
  };

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Business Matching · Kebutuhan Kami</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Kebutuhan Pembelian B2B</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Publikasikan kebutuhan bahan baku atau produk {data.businessName} agar dapat ditemukan oleh pelaku usaha pemasok yang sesuai.</p></div>
        {data.canEdit && <button type="button" onClick={() => openForm()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0FA3B1] px-5 text-sm font-bold text-white"><Plus size={18} /> Buat Kebutuhan</button>}
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><Stat value={data.needs.length} label="Total kebutuhan" /><Stat value={data.needs.filter((item) => item.status === "PUBLISHED").length} label="Sedang dipublikasikan" /><Stat value={data.needs.filter((item) => item.status === "DRAFT").length} label="Masih draf" /></div>
    </section>

    {feedback && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 size={18} />{feedback.message}</div>}

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        <button type="button" onClick={() => setActiveTab("OWN")} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${activeTab === "OWN" ? "bg-[#073B4C] text-white" : "text-slate-500 hover:bg-slate-50"}`}>Kebutuhan Saya ({data.needs.length})</button>
        <button type="button" onClick={() => setActiveTab("MARKET")} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${activeTab === "MARKET" ? "bg-[#073B4C] text-white" : "text-slate-500 hover:bg-slate-50"}`}>Peluang Pasar ({data.opportunities.length})</button>
        <button type="button" onClick={() => setActiveTab("OFFERS")} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${activeTab === "OFFERS" ? "bg-[#073B4C] text-white" : "text-slate-500 hover:bg-slate-50"}`}>Penawaran ({data.offers.length})</button>
      </div>
      {activeTab !== "OFFERS" && <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1"><span className="sr-only">Cari kebutuhan</span><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === "OWN" ? "Cari kebutuhan, komoditas, atau lokasi..." : "Cari peluang, pemilik, komoditas, atau lokasi..."} className={`${inputClass} mt-0 pl-10`} /></label>
        {activeTab === "MARKET" && <select aria-label="Filter komoditas" value={commodityFilter} onChange={(event) => setCommodityFilter(event.target.value)} className={`${inputClass} mt-0 sm:max-w-64`}><option value="">Semua komoditas</option>{data.options.commodities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}
      </div>}
    </section>

    {activeTab === "OWN" && (needs.length ? <div className="grid gap-5 lg:grid-cols-2">{needs.map((need) => <article key={need.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{need.commodityName} · {need.categoryName}</p><h2 className="mt-2 text-lg font-bold text-[#073B4C]">{need.title}</h2></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass[need.status]}`}>{statusLabel[need.status]}</span></div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{need.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={<PackageSearch size={16} />} label="Jumlah" value={`${formatNumber(need.quantity)} ${need.unitSymbol}`} /><Info icon={<CircleDollarSign size={16} />} label="Anggaran" value={budget(need)} /><Info icon={<MapPin size={16} />} label="Lokasi pengiriman" value={need.deliveryLocation} /><Info icon={<CalendarDays size={16} />} label="Dibutuhkan" value={need.requiredAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${need.requiredAt}T00:00:00`)) : "Fleksibel"} /></div>
      {data.canEdit && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {need.status === "DRAFT" && <><button onClick={() => openForm(need)} className="rounded-lg border border-slate-200 p-2 text-[#087E8B]" aria-label={`Edit ${need.title}`}><Pencil size={16} /></button><button disabled={busyId === need.id} onClick={() => action(need, "PUBLISH")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white"><Send size={14} /> Publikasikan</button><button disabled={busyId === need.id} onClick={() => { if (window.confirm(`Hapus draf ${need.title}?`)) void action(need, "DELETE"); }} className="ml-auto rounded-lg border border-red-100 p-2 text-[#E63946]" aria-label={`Hapus ${need.title}`}><Trash2 size={16} /></button></>}
        {need.status === "PUBLISHED" && <button disabled={busyId === need.id} onClick={() => action(need, "CLOSE")} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700">Tutup Kebutuhan</button>}
        {need.status === "CLOSED" && <button disabled={busyId === need.id} onClick={() => action(need, "REOPEN")} className="rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white">Buka Kembali</button>}
      </div>}
    </article>)}</div> : <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><PackageSearch className="h-12 w-12 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-[#073B4C]">Belum ada kebutuhan</h2><p className="mt-2 max-w-md text-sm text-slate-500">Buat kebutuhan pembelian pertama agar calon pemasok dapat menawarkan produk yang sesuai.</p></section>)}

    {activeTab === "MARKET" && (opportunities.length ? <div className="grid gap-5 lg:grid-cols-2">{opportunities.map((need) => <article key={need.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#61C0BF] hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{need.commodityName} · {need.categoryName}</p><h2 className="mt-2 text-lg font-bold text-[#073B4C]">{need.title}</h2></div><span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Terbuka</span></div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><Building2 size={15} className="text-[#087E8B]" /><span>{need.businessName}</span><span aria-hidden="true">·</span><span>{need.businessLocation}</span></div>
      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{need.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={<PackageSearch size={16} />} label="Jumlah" value={`${formatNumber(need.quantity)} ${need.unitSymbol}`} /><Info icon={<CircleDollarSign size={16} />} label="Anggaran" value={budget(need)} /><Info icon={<MapPin size={16} />} label="Tujuan pengiriman" value={need.deliveryLocation} /><Info icon={<CalendarDays size={16} />} label="Dibutuhkan" value={formatRequiredAt(need.requiredAt)} /></div>
      <button type="button" onClick={() => setSelectedOpportunity(need)} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#087E8B]/25 text-sm font-bold text-[#087E8B] transition hover:bg-[#087E8B] hover:text-white"><Eye size={16} /> Lihat Detail Peluang</button>
    </article>)}</div> : <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><PackageSearch className="h-12 w-12 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-[#073B4C]">Belum ada peluang yang sesuai</h2><p className="mt-2 max-w-md text-sm text-slate-500">Kebutuhan yang dipublikasikan oleh pelaku usaha lain akan muncul di sini.</p></section>)}

    {activeTab === "OFFERS" && (data.offers.length ? <div className="grid gap-5 lg:grid-cols-2">{data.offers.map((offer) => <OfferCard key={offer.id} offer={offer} busy={busyId === offer.id} onAction={offerAction} />)}</div> : <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><Send className="h-12 w-12 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-[#073B4C]">Belum ada penawaran</h2><p className="mt-2 max-w-md text-sm text-slate-500">Penawaran yang Anda kirim atau terima akan tampil di sini.</p></section>)}

    {editing !== undefined && <NeedForm editing={editing} data={data} register={register} errors={errors} submitting={isSubmitting} onClose={() => setEditing(undefined)} onSubmit={handleSubmit(save)} />}
    {selectedOpportunity && <OpportunityDetail need={selectedOpportunity} onClose={() => setSelectedOpportunity(null)} onSent={async (message) => { await reload(); setSelectedOpportunity(null); setActiveTab("OFFERS"); setFeedback({ kind: "success", message }); }} />}
  </div>;
}

function OpportunityDetail({ need, onClose, onSent }: { readonly need: BusinessOpportunityView; readonly onClose: () => void; readonly onSent: (message: string) => Promise<void> }) {
  const [showOffer, setShowOffer] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<BusinessOfferInput>({
    resolver: zodResolver(businessOfferInputSchema),
    defaultValues: { businessNeedId: need.id, quantity: need.quantity, unitPrice: "", leadTimeDays: 1, validUntil: "", message: "" },
  });
  const submit = async (input: BusinessOfferInput) => {
    const response = await fetch("/api/business/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const result = await response.json() as ApiResponse;
    if (!result.success) {
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        if (messages[0]) setError(field as keyof BusinessOfferInput, { message: messages[0] });
      });
      setFormFeedback(result.message);
      return;
    }
    await onSent(result.message);
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="opportunity-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
    <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{need.commodityName} · {need.categoryName}</p><h2 id="opportunity-title" className="mt-2 text-xl font-bold text-[#073B4C]">{need.title}</h2><p className="mt-2 text-sm font-semibold text-slate-500">{need.businessName} · {need.businessLocation}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" aria-label="Tutup detail peluang"><X size={20} /></button></div>
    <div className="space-y-5 p-5 sm:p-7"><div className="grid gap-3 sm:grid-cols-2"><Info icon={<PackageSearch size={16} />} label="Jumlah" value={`${formatNumber(need.quantity)} ${need.unitName} (${need.unitSymbol})`} /><Info icon={<CircleDollarSign size={16} />} label="Anggaran" value={budget(need)} /><Info icon={<MapPin size={16} />} label="Tujuan pengiriman" value={need.deliveryLocation} /><Info icon={<CalendarDays size={16} />} label="Tanggal dibutuhkan" value={formatRequiredAt(need.requiredAt)} /></div>
      <DetailText label="Deskripsi" value={need.description} /><DetailText label="Spesifikasi mutu/produk" value={need.specifications || "Tidak ada spesifikasi tambahan."} />
      {!showOffer ? <button type="button" onClick={() => setShowOffer(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white"><Send size={17} /> Kirim Penawaran</button>
        : <form onSubmit={handleSubmit(submit)} className="grid gap-4 rounded-2xl border border-[#0FA3B1]/20 bg-[#0FA3B1]/5 p-4 sm:grid-cols-2">
          <h3 className="font-bold text-[#073B4C] sm:col-span-2">Detail Penawaran</h3>
          {formFeedback && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{formFeedback}</p>}
          <input type="hidden" {...register("businessNeedId")} />
          <Field label={`Jumlah (${need.unitSymbol}) *`} error={errors.quantity?.message}><input {...register("quantity")} inputMode="decimal" className={inputClass} /></Field>
          <Field label={`Harga per ${need.unitSymbol} *`} error={errors.unitPrice?.message}><input {...register("unitPrice")} inputMode="decimal" placeholder="Rupiah" className={inputClass} /></Field>
          <Field label="Waktu pengiriman (hari) *" error={errors.leadTimeDays?.message}><input {...register("leadTimeDays", { valueAsNumber: true })} type="number" min="1" max="365" className={inputClass} /></Field>
          <Field label="Berlaku sampai *" error={errors.validUntil?.message}><input {...register("validUntil")} type="date" className={inputClass} /></Field>
          <Field label="Pesan penawaran *" error={errors.message?.message} wide><textarea {...register("message")} rows={4} placeholder="Jelaskan kesiapan stok, mutu produk, kemasan, dan ketentuan penawaran." className={`${inputClass} py-3`} /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setShowOffer(false)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600">Batal</button><button disabled={isSubmitting} className="min-h-10 rounded-xl bg-[#087E8B] px-4 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? "Mengirim..." : "Kirim Penawaran"}</button></div>
        </form>}
    </div>
  </div></div>;
}

function OfferCard({ offer, busy, onAction }: { readonly offer: BusinessOfferView; readonly busy: boolean; readonly onAction: (offer: BusinessOfferView, action: "WITHDRAW" | "ACCEPT" | "REJECT") => Promise<void> }) {
  const [showContact, setShowContact] = useState(false);
  const labels: Record<BusinessOfferView["status"], string> = { SUBMITTED: "Menunggu respons", ACCEPTED: "Diterima", REJECTED: "Ditolak", WITHDRAWN: "Ditarik" };
  const classes: Record<BusinessOfferView["status"], string> = { SUBMITTED: "bg-amber-50 text-amber-700", ACCEPTED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700", WITHDRAWN: "bg-slate-100 text-slate-600" };
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{offer.direction === "OUTGOING" ? "Penawaran dikirim" : "Penawaran diterima"}</p><h2 className="mt-2 text-lg font-bold text-[#073B4C]">{offer.needTitle}</h2><p className="mt-1 text-sm text-slate-500">{offer.counterpartyName}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[offer.status]}`}>{labels[offer.status]}</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={<PackageSearch size={16} />} label="Jumlah ditawarkan" value={`${formatNumber(offer.quantity)} ${offer.unitSymbol}`} /><Info icon={<CircleDollarSign size={16} />} label="Harga satuan" value={formatCurrency(offer.unitPrice)} /><Info icon={<CalendarDays size={16} />} label="Waktu pengiriman" value={`${offer.leadTimeDays} hari`} /><Info icon={<CalendarDays size={16} />} label="Berlaku sampai" value={formatRequiredAt(offer.validUntil)} /></div>
    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{offer.message}</p>
    {offer.responseNotes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong>Catatan respons:</strong> {offer.responseNotes}</p>}
    {offer.status === "SUBMITTED" && <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">{offer.direction === "OUTGOING" ? <button disabled={busy} onClick={() => void onAction(offer, "WITHDRAW")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Tarik Penawaran</button> : <><button disabled={busy} onClick={() => void onAction(offer, "ACCEPT")} className="rounded-lg bg-[#2E9F6B] px-3 py-2 text-xs font-bold text-white">Terima</button><button disabled={busy} onClick={() => void onAction(offer, "REJECT")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Tolak</button></>}</div>}
    {offer.status === "ACCEPTED" && offer.counterparty && <BusinessContactPanel contact={offer.counterparty} open={showContact} onToggle={() => setShowContact((current) => !current)} />}
  </article>;
}

function BusinessContactPanel({ contact, open, onToggle }: { readonly contact: NonNullable<BusinessOfferView["counterparty"]>; readonly open: boolean; readonly onToggle: () => void }) {
  const whatsappUrl = createWhatsappUrl(contact.whatsapp);
  return <div className="mt-5 border-t border-slate-100 pt-4"><button type="button" onClick={onToggle} aria-expanded={open} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-4 text-sm font-bold text-white"><MessageCircle size={17} /> Hubungi Mitra</button>{open && <section className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-[#073B4C]"><Building2 size={17} /> Profil Pelaku Usaha</h3><p className="mt-3 font-bold text-[#073B4C]">{contact.businessName}</p><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin size={16} className="mt-1 shrink-0 text-[#087E8B]" />{contact.address}</p><div className="mt-3 flex flex-col gap-2">{contact.email ? <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#087E8B] hover:underline"><Mail size={16} />{contact.email}</a> : <p className="text-sm text-slate-500">Email belum dilengkapi</p>}{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E9F6B] hover:underline"><MessageCircle size={16} />{contact.whatsapp}</a> : <p className="text-sm text-slate-500">Nomor WhatsApp belum dilengkapi</p>}</div></section>}</div>;
}

function createWhatsappUrl(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const internationalNumber = digits.startsWith("0") ? `62${digits.slice(1)}` : digits.startsWith("62") ? digits : `62${digits}`;
  return `https://wa.me/${internationalNumber}`;
}

function DetailText({ label, value }: { readonly label: string; readonly value: string }) { return <section><h3 className="text-sm font-bold text-[#073B4C]">{label}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p></section>; }

function NeedForm({ editing, data, register, errors, submitting, onClose, onSubmit }: {
  readonly editing: BusinessNeedView | null; readonly data: BusinessNeedPageData;
  readonly register: ReturnType<typeof useForm<BusinessNeedInput>>["register"];
  readonly errors: ReturnType<typeof useForm<BusinessNeedInput>>["formState"]["errors"];
  readonly submitting: boolean; readonly onClose: () => void; readonly onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:px-7"><div><h2 className="text-lg font-bold text-[#073B4C]">{editing ? "Edit Kebutuhan" : "Buat Kebutuhan"}</h2><p className="mt-1 text-xs text-slate-500">Data disimpan sebagai draf sebelum dipublikasikan.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400" aria-label="Tutup formulir"><X size={20} /></button></div><form onSubmit={onSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
    <Field label="Judul kebutuhan *" error={errors.title?.message} wide><input {...register("title")} placeholder="Contoh: Kebutuhan ikan tuna loin beku" className={inputClass} /></Field>
    <Select label="Komoditas *" name="commodityId" register={register} options={data.options.commodities} error={errors.commodityId?.message} />
    <Select label="Kategori produk *" name="categoryId" register={register} options={data.options.categories} error={errors.categoryId?.message} />
    <Field label="Jumlah kebutuhan *" error={errors.quantity?.message}><input {...register("quantity")} inputMode="decimal" className={inputClass} /></Field>
    <Select label="Satuan *" name="unitId" register={register} options={data.options.units} error={errors.unitId?.message} />
    <Field label="Deskripsi kebutuhan *" error={errors.description?.message} wide><textarea {...register("description")} rows={4} className={`${inputClass} py-3`} /></Field>
    <Field label="Spesifikasi mutu/produk" error={errors.specifications?.message} wide><textarea {...register("specifications")} rows={3} placeholder="Ukuran, grade, bentuk, kemasan, sertifikasi, atau standar mutu." className={`${inputClass} py-3`} /></Field>
    <Field label="Anggaran minimum" error={errors.minimumBudget?.message}><input {...register("minimumBudget")} inputMode="decimal" placeholder="Rupiah" className={inputClass} /></Field>
    <Field label="Anggaran maksimum" error={errors.maximumBudget?.message}><input {...register("maximumBudget")} inputMode="decimal" placeholder="Rupiah" className={inputClass} /></Field>
    <Field label="Lokasi pengiriman *" error={errors.deliveryLocation?.message}><input {...register("deliveryLocation")} placeholder="Kabupaten/kota tujuan" className={inputClass} /></Field>
    <Field label="Tanggal dibutuhkan" error={errors.requiredAt?.message}><input {...register("requiredAt")} type="date" className={inputClass} /></Field>
    <label className="flex items-center gap-2 text-sm font-semibold text-[#073B4C] sm:col-span-2"><input type="checkbox" {...register("isBudgetNegotiable")} className="h-4 w-4 accent-[#087E8B]" /> Anggaran dapat dinegosiasikan</label>
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Batal</button><button disabled={submitting} className="min-h-11 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan Draf"}</button></div>
  </form></div></div>;
}

function Field({ label, error, wide, children }: { readonly label: string; readonly error?: string; readonly wide?: boolean; readonly children: React.ReactNode }) { return <label className={`text-sm font-bold text-[#073B4C] ${wide ? "sm:col-span-2" : ""}`}>{label}{children}{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>; }
function Select({ label, name, register, options, error }: { readonly label: string; readonly name: "commodityId" | "categoryId" | "unitId"; readonly register: ReturnType<typeof useForm<BusinessNeedInput>>["register"]; readonly options: readonly { readonly id: string; readonly label: string }[]; readonly error?: string }) { return <Field label={label} error={error}><select {...register(name)} className={inputClass}><option value="">Pilih {label.toLocaleLowerCase("id")}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>; }
function Stat({ value, label }: { readonly value: number; readonly label: string }) { return <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{value}</strong><span className="text-xs text-white/70">{label}</span></div>; }
function Info({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{icon}{label}</span><strong className="mt-2 block text-xs text-[#073B4C]">{value}</strong></div>; }
function formatNumber(value: string) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value)); }
function formatCurrency(value: string) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)); }
function formatRequiredAt(value: string) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`)) : "Fleksibel"; }
function budget(need: BusinessNeedView) { const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); const range = need.minimumBudget && need.maximumBudget ? `${formatter.format(Number(need.minimumBudget))}–${formatter.format(Number(need.maximumBudget))}` : need.minimumBudget || need.maximumBudget ? formatter.format(Number(need.minimumBudget || need.maximumBudget)) : "Tidak dicantumkan"; return need.isBudgetNegotiable ? `${range} · Nego` : range; }
