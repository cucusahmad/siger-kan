import {
  ArrowRight, Building2, ClipboardList, FlaskConical,
  Handshake, PackageCheck, TrendingUp,
} from "lucide-react";
import Link from "next/link";

import type { ExecutiveBreakdown, ExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.types";

interface ExecutiveDashboardProps {
  readonly name: string;
  readonly roleLabel: string;
  readonly data: ExecutiveDashboardData;
}

const icons = [Building2, PackageCheck, ClipboardList, Handshake, FlaskConical] as const;
const labelMap: Readonly<Record<string, string>> = {
  ACTIVE: "Aktif", PENDING_VERIFICATION: "Menunggu Verifikasi", VERIFIED: "Terverifikasi",
  DRAFT: "Draf", REVISION_REQUIRED: "Perlu Revisi", REJECTED: "Ditolak", INACTIVE: "Tidak Aktif",
  PUBLISHED: "Dipublikasikan", CLOSED: "Ditutup", SELESAI: "Selesai",
  DALAM_PENGUJIAN: "Dalam Pengujian", DIAJUKAN: "Diajukan", DISETUJUI: "Disetujui",
  MENUNGGU_PERSETUJUAN_UPTD: "Menunggu Persetujuan UPTD", MENUNGGU_SAMPEL: "Menunggu Sampel",
  SAMPEL_DIKIRIM: "Sampel Dikirim", SAMPEL_DITERIMA: "Sampel Diterima", KAJI_ULANG: "Kaji Ulang",
};

export function ExecutiveDashboard({ name, roleLabel, data }: ExecutiveDashboardProps) {
  const maxTrend = Math.max(1, ...data.trend.flatMap((item) => [item.businesses, item.products, item.matches]));
  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-aqua">{roleLabel}</span><h1 className="mt-5 text-3xl font-bold sm:text-4xl">Selamat datang, {name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Pantau kinerja layanan perikanan, pertumbuhan pelaku usaha, produk unggulan, business matching, dan pengujian mutu dari satu ruang kendali.</p></div>
        <div className="flex flex-wrap gap-3"><span className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/75">Diperbarui {formatDateTime(data.generatedAt)}</span><Link href="/dashboard/executive-report" className="inline-flex items-center gap-2 rounded-xl bg-aqua px-4 py-3 text-xs font-bold text-navy transition hover:bg-white">Buka laporan lengkap <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </header>

    <section aria-label="Indikator utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {data.metrics.map((metric, index) => {
        const Icon = icons[index];
        return <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(7,59,76,.05)]"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-seafoam text-ocean"><Icon className="h-5 w-5" /></span><p className="mt-5 text-3xl font-bold text-navy">{metric.value.toLocaleString("id-ID")}</p><p className="mt-1 text-sm font-bold text-ink">{metric.label}</p><p className="mt-1 text-xs text-muted">{metric.detail}</p></article>;
      })}
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-ocean">Tren 6 bulan</p><h2 className="mt-2 text-lg font-bold text-navy">Pertumbuhan Ekosistem</h2></div><TrendingUp className="h-5 w-5 text-ocean" /></div>
        <div className="mt-7 flex h-56 items-end gap-3 border-b border-slate-200 pb-2 sm:gap-6">
          {data.trend.map((point) => <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="flex h-[180px] items-end justify-center gap-1"><TrendBar value={point.businesses} max={maxTrend} color="bg-[#087E8B]" label="Pelaku usaha" /><TrendBar value={point.products} max={maxTrend} color="bg-[#0FA3B1]" label="Produk" /><TrendBar value={point.matches} max={maxTrend} color="bg-[#F4B942]" label="Matching" /></div><p className="mt-3 truncate text-center text-[10px] font-semibold text-muted">{point.label}</p></div>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-xs text-muted"><Legend color="bg-[#087E8B]" label="Pelaku usaha" /><Legend color="bg-[#0FA3B1]" label="Produk" /><Legend color="bg-[#F4B942]" label="Business matching" /></div>
      </section>
      <BreakdownCard title="Sebaran Pelaku Usaha" subtitle="Berdasarkan kabupaten/kota" data={data.topRegions} />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <BreakdownCard title="Status Pelaku Usaha" subtitle="Kondisi registrasi dan verifikasi" data={data.businessStatuses} />
      <BreakdownCard title="Status Produk" subtitle="Kesiapan produk pada katalog" data={data.productStatuses} />
      <BreakdownCard title="Komoditas Unggulan" subtitle="Produk terbanyak per komoditas" data={data.topCommodities} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <BreakdownCard title="Ringkasan Pengujian" subtitle="Posisi seluruh pengajuan pengujian mutu saat ini" data={data.testingPipeline} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Ringkasan Business Match</h2><p className="mt-1 text-sm text-muted">Aktivitas permintaan dan penawaran terbaru.</p></div><Link href="/dashboard/executive-report?section=matching" className="text-xs font-bold text-ocean">Lihat semua</Link></div>
        <div className="divide-y divide-slate-100">{data.matches.slice(0, 5).map((item) => <div key={item.id} className="flex items-start gap-4 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><Handshake className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-navy">{item.subject}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-muted">{item.source}</span></div><p className="mt-1 text-xs text-muted">{item.requester} → {item.partner}</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${item.status === "ACCEPTED" ? "bg-[#EAF7F0] text-[#247D55]" : "bg-[#FFF7E2] text-[#8A6411]"}`}>{labelMap[item.status] ?? item.status}</span></div>)}</div>
        {!data.matches.length && <p className="p-10 text-center text-sm text-muted">Belum ada aktivitas business matching.</p>}
      </section>
    </div>
  </div>;
}

function TrendBar({ value, max, color, label }: { readonly value: number; readonly max: number; readonly color: string; readonly label: string }) {
  return <div title={`${label}: ${value}`} className={`min-h-1 w-2 rounded-t-md sm:w-4 ${color}`} style={{ height: `${Math.max(value ? 8 : 2, (value / max) * 100)}%` }}><span className="sr-only">{label}: {value}</span></div>;
}

function Legend({ color, label }: { readonly color: string; readonly label: string }) {
  return <span className="inline-flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>;
}

function BreakdownCard({ title, subtitle, data }: { readonly title: string; readonly subtitle: string; readonly data: readonly ExecutiveBreakdown[] }) {
  const max = Math.max(1, ...data.map(({ value }) => value));
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-navy">{title}</h2><p className="mt-1 text-xs text-muted">{subtitle}</p><div className="mt-6 space-y-4">{data.slice(0, 7).map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-semibold text-ink">{labelMap[item.label] ?? item.label.replaceAll("_", " ")}</span><span className="font-bold text-navy">{item.value.toLocaleString("id-ID")}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ocean" style={{ width: `${(item.value / max) * 100}%` }} /></div></div>)}</div>{!data.length && <p className="mt-8 text-center text-sm text-muted">Data belum tersedia.</p>}</section>;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}
