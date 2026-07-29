import { ArrowRight, Building2, CheckCircle2, Clock3, FlaskConical, TestTubes } from "lucide-react";
import Link from "next/link";

import type { ExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.types";

import { formatExecutiveDate, humanizeStatus, MetricCard, StatusDistribution, statusClass } from "./ExecutiveSummaryUi";

export function TestingSummaryDashboard({ data }: { readonly data: ExecutiveDashboardData }) {
  const completed = data.testing.filter(({ status }) => status === "SELESAI").length;
  const active = data.testing.filter(({ status }) => !["SELESAI", "DITOLAK"].includes(status)).length;
  const laboratories = new Set(data.testing.map(({ laboratoryName }) => laboratoryName).filter((name) => name !== "Belum ditentukan")).size;
  const completionRate = data.testing.length ? Math.round((completed / data.testing.length) * 100) : 0;

  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Dashboard Pimpinan</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">Ringkasan Pengujian</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Pantau volume pengajuan, progres layanan laboratorium, tingkat penyelesaian, dan pengujian terbaru.</p></div><Link href="/dashboard/testing-summary/report" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-aqua px-5 text-sm font-bold text-navy transition hover:bg-white">Laporan Lengkap <ArrowRight className="h-4 w-4" /></Link></div>
    </header>
    <section aria-label="Indikator pengujian" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={FlaskConical} label="Total Pengujian" value={data.testing.length} detail="Seluruh permohonan yang telah diajukan" />
      <MetricCard icon={Clock3} label="Sedang Diproses" value={active} detail="Pengujian dalam antrean dan proses laboratorium" tone="warning" />
      <MetricCard icon={CheckCircle2} label="Selesai" value={completed} detail="Pengujian dengan proses telah selesai" tone="success" />
      <MetricCard icon={TestTubes} label="Tingkat Penyelesaian" value={`${completionRate}%`} detail="Persentase pengujian yang telah selesai" />
      <MetricCard icon={Building2} label="Laboratorium" value={laboratories} detail="Laboratorium yang menangani pengujian" />
    </section>
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <StatusDistribution title="Distribusi Status Pengujian" subtitle="Komposisi seluruh tahapan layanan pengujian" data={data.testingPipeline} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Pengujian Terbaru</h2><p className="mt-1 text-xs text-muted">Lima pengajuan yang terakhir diperbarui.</p></div><Link href="/dashboard/testing-summary/report" className="text-xs font-bold text-ocean">Lihat semua</Link></div>
        <div className="divide-y divide-slate-100">{data.testing.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><FlaskConical className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-bold text-navy">{item.applicationNumber}</p><p className="mt-1 truncate text-xs text-muted">{item.businessName} · {item.productName}</p><p className="mt-1 text-[11px] text-muted">{item.submittedAt ? formatExecutiveDate(item.submittedAt) : "Belum diajukan"} · {item.laboratoryName}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span></div>)}</div>
        {!data.testing.length && <p className="p-10 text-center text-sm text-muted">Belum ada data pengujian.</p>}
      </section>
    </div>
  </div>;
}
