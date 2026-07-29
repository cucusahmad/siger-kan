import { ArrowRight, BadgeCheck, CircleDollarSign, Handshake, PackageSearch, Send } from "lucide-react";
import Link from "next/link";

import type { ExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.types";

import { formatExecutiveDate, humanizeStatus, MetricCard, StatusDistribution, statusClass } from "./ExecutiveSummaryUi";

export function BusinessMatchSummaryDashboard({ data }: { readonly data: ExecutiveDashboardData }) {
  const accepted = data.matches.filter(({ status }) => status === "ACCEPTED").length;
  const potentialValue = data.matches.reduce((sum, item) => sum + Number(item.value), 0);
  const needs = data.matches.filter(({ source }) => source === "KEBUTUHAN").length;
  const products = data.matches.filter(({ source }) => source === "PRODUK").length;
  const distribution = [...new Set(data.matches.map(({ status }) => status))].map((label) => ({ label, value: data.matches.filter(({ status }) => status === label).length })).sort((a, b) => b.value - a.value);

  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Dashboard Pimpinan</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">Ringkasan Business Match</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Pantau interaksi kebutuhan dan produk, penawaran masuk, kesepakatan, serta potensi nilai transaksi.</p></div><Link href="/dashboard/business-match-summary/report" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-aqua px-5 text-sm font-bold text-navy transition hover:bg-white">Laporan Lengkap <ArrowRight className="h-4 w-4" /></Link></div>
    </header>
    <section aria-label="Indikator business match" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={Handshake} label="Total Aktivitas" value={data.matches.length} detail="Seluruh penawaran kebutuhan dan produk" />
      <MetricCard icon={PackageSearch} label="Penawaran Kebutuhan" value={needs} detail="Respons pemasok terhadap kebutuhan usaha" />
      <MetricCard icon={Send} label="Penawaran Produk" value={products} detail="Minat pembeli terhadap produk katalog" />
      <MetricCard icon={BadgeCheck} label="Kesepakatan Diterima" value={accepted} detail="Penawaran yang disetujui para pihak" tone="success" />
      <MetricCard icon={CircleDollarSign} label="Potensi Transaksi" value={formatCompactCurrency(potentialValue)} detail="Akumulasi nilai seluruh penawaran" tone="warning" />
    </section>
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <StatusDistribution title="Distribusi Status Matching" subtitle="Komposisi status seluruh aktivitas business match" data={distribution} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Aktivitas Matching Terbaru</h2><p className="mt-1 text-xs text-muted">Lima penawaran terbaru dari ekosistem usaha.</p></div><Link href="/dashboard/business-match-summary/report" className="text-xs font-bold text-ocean">Lihat semua</Link></div>
        <div className="divide-y divide-slate-100">{data.matches.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><Handshake className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-navy">{item.subject}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-muted">{humanizeStatus(item.source)}</span></div><p className="mt-1 truncate text-xs text-muted">{item.requester} → {item.partner}</p><p className="mt-1 text-[11px] text-muted">{formatExecutiveDate(item.submittedAt)} · {item.quantity}</p></div><div className="sm:text-right"><p className="text-xs font-bold text-navy">{formatCurrency(item.value)}</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span></div></div>)}</div>
        {!data.matches.length && <p className="p-10 text-center text-sm text-muted">Belum ada aktivitas business matching.</p>}
      </section>
    </div>
  </div>;
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
