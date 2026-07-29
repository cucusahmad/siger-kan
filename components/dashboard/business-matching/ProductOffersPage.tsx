"use client";

import { Building2, CalendarDays, CheckCircle2, CircleDollarSign, Inbox, Mail, MapPin, MessageCircle, PackageSearch, Send } from "lucide-react";
import { useMemo, useState } from "react";

import type { ProductOfferPageData, ProductOfferView } from "@/features/product-offers/product-offer.types";

interface Props {
  readonly initialData: ProductOfferPageData;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: ProductOfferView;
}

export function ProductOffersPage({ initialData }: Props) {
  const [offers, setOffers] = useState(initialData.offers);
  const [tab, setTab] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly message: string } | null>(null);
  const visibleOffers = useMemo(() => offers.filter((offer) => offer.direction === tab), [offers, tab]);
  const incomingPending = offers.filter((offer) => offer.direction === "INCOMING" && offer.status === "SUBMITTED").length;

  const action = async (offer: ProductOfferView, value: "WITHDRAW" | "ACCEPT" | "REJECT") => {
    const notes = value === "WITHDRAW" ? "" : window.prompt(value === "ACCEPT" ? "Catatan penerimaan (opsional):" : "Alasan penolakan (opsional):") ?? "";
    setBusyId(offer.id);
    const response = await fetch(`/api/product-offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: value, notes }),
    });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success && result.data) {
      setOffers((current) => current.map((item) => item.id === result.data?.id ? result.data : item));
    }
  };

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Business Matching · Penawaran Produk</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Kelola Penawaran Produk</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Pantau penawaran yang masuk untuk produk {initialData.businessName} dan penawaran yang telah usaha Anda kirimkan.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><Stat value={offers.length} label="Total penawaran" /><Stat value={incomingPending} label="Menunggu respons Anda" /><Stat value={offers.filter((item) => item.status === "ACCEPTED").length} label="Penawaran diterima" /></div>
    </section>

    {feedback && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 size={18} />{feedback.message}</div>}

    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setTab("INCOMING")} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${tab === "INCOMING" ? "bg-[#073B4C] text-white" : "text-slate-500 hover:bg-slate-50"}`}><Inbox size={17} /> Penawaran Masuk ({offers.filter((item) => item.direction === "INCOMING").length})</button>
        <button type="button" onClick={() => setTab("OUTGOING")} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold ${tab === "OUTGOING" ? "bg-[#073B4C] text-white" : "text-slate-500 hover:bg-slate-50"}`}><Send size={17} /> Penawaran Dikirim ({offers.filter((item) => item.direction === "OUTGOING").length})</button>
      </div>
    </section>

    {visibleOffers.length === 0 ? <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><Inbox className="h-10 w-10 text-slate-300" /><h2 className="mt-4 font-bold text-[#073B4C]">Belum ada penawaran {tab === "INCOMING" ? "masuk" : "dikirim"}</h2><p className="mt-2 max-w-md text-sm text-slate-500">{tab === "INCOMING" ? "Penawaran dari pelaku usaha lain terhadap produk Anda akan tampil di sini." : "Ajukan penawaran dari halaman katalog produk untuk memulai business matching."}</p></section> : <section className="grid gap-5 xl:grid-cols-2">{visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} busy={busyId === offer.id} onAction={action} />)}</section>}
  </div>;
}

function OfferCard({ offer, busy, onAction }: { readonly offer: ProductOfferView; readonly busy: boolean; readonly onAction: (offer: ProductOfferView, action: "WITHDRAW" | "ACCEPT" | "REJECT") => Promise<void> }) {
  const [showContact, setShowContact] = useState(false);
  const labels: Record<ProductOfferView["status"], string> = { SUBMITTED: "Menunggu respons", ACCEPTED: "Diterima", REJECTED: "Ditolak", WITHDRAWN: "Ditarik" };
  const classes: Record<ProductOfferView["status"], string> = { SUBMITTED: "bg-amber-50 text-amber-700", ACCEPTED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700", WITHDRAWN: "bg-slate-100 text-slate-600" };
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{offer.direction === "OUTGOING" ? "Penawaran kepada" : "Penawaran dari"} · {offer.counterpartyName}</p><h2 className="mt-2 text-lg font-bold text-[#073B4C]">{offer.productName}</h2><p className="mt-1 text-xs text-slate-400">Diajukan {formatDate(offer.submittedAt.slice(0, 10))}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[offer.status]}`}>{labels[offer.status]}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={<PackageSearch size={16} />} label="Jumlah" value={`${formatNumber(offer.quantity)} ${offer.unitSymbol}`} /><Info icon={<CircleDollarSign size={16} />} label="Harga satuan" value={formatCurrency(offer.unitPrice)} /><Info icon={<CalendarDays size={16} />} label="Berlaku sampai" value={formatDate(offer.validUntil)} /><Info icon={<MapPin size={16} />} label="Tujuan pengiriman" value={offer.deliveryAddress} /></div><p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{offer.message}</p>{offer.responseNotes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong>Catatan respons:</strong> {offer.responseNotes}</p>}{offer.status === "SUBMITTED" && <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">{offer.direction === "OUTGOING" ? <button disabled={busy} onClick={() => void onAction(offer, "WITHDRAW")} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50">Tarik Penawaran</button> : <><button disabled={busy} onClick={() => void onAction(offer, "ACCEPT")} className="rounded-xl bg-[#2E9F6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Terima Penawaran</button><button disabled={busy} onClick={() => void onAction(offer, "REJECT")} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50">Tolak</button></>}</div>}{offer.status === "ACCEPTED" && offer.counterparty && <ContactPanel contact={offer.counterparty} open={showContact} onToggle={() => setShowContact((current) => !current)} />}</article>;
}

function ContactPanel({ contact, open, onToggle }: { readonly contact: NonNullable<ProductOfferView["counterparty"]>; readonly open: boolean; readonly onToggle: () => void }) {
  const whatsappUrl = createWhatsappUrl(contact.whatsapp);
  return <div className="mt-5 border-t border-slate-100 pt-4"><button type="button" onClick={onToggle} aria-expanded={open} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087E8B] px-4 text-sm font-bold text-white"><MessageCircle size={17} /> Hubungi Mitra</button>{open && <section className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-[#073B4C]"><Building2 size={17} /> Profil Pelaku Usaha</h3><p className="mt-3 font-bold text-[#073B4C]">{contact.businessName}</p><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin size={16} className="mt-1 shrink-0 text-[#087E8B]" />{contact.address}</p><div className="mt-3 flex flex-col gap-2">{contact.email ? <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#087E8B] hover:underline"><Mail size={16} />{contact.email}</a> : <p className="text-sm text-slate-500">Email belum dilengkapi</p>}{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E9F6B] hover:underline"><MessageCircle size={16} />{contact.whatsapp}</a> : <p className="text-sm text-slate-500">Nomor WhatsApp belum dilengkapi</p>}</div></section>}</div>;
}

function createWhatsappUrl(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const internationalNumber = digits.startsWith("0") ? `62${digits.slice(1)}` : digits.startsWith("62") ? digits : `62${digits}`;
  return `https://wa.me/${internationalNumber}`;
}

function Stat({ value, label }: { readonly value: number; readonly label: string }) { return <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{value}</strong><span className="text-xs text-white/70">{label}</span></div>; }
function Info({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{icon}{label}</span><strong className="mt-2 block text-xs leading-5 text-[#073B4C]">{value}</strong></div>; }
function formatNumber(value: string) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value)); }
function formatCurrency(value: string) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`)); }
