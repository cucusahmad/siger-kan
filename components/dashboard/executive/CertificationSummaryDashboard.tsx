import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, History, ScrollText } from "lucide-react";
import Link from "next/link";

import type { CertificationSummaryData } from "@/features/executive-dashboard/certification-summary.types";

import { formatExecutiveDate, humanizeStatus, MetricCard, StatusDistribution, statusClass } from "./ExecutiveSummaryUi";

const completedStatuses = new Set(["AUDIT_COMPLETED", "CORRECTIVE_ACTION_VERIFIED"]);

export function CertificationSummaryDashboard({ data }: { readonly data: CertificationSummaryData }) {
  const sigerkan = data.rows.filter(({ source }) => source === "SIGERKAN");
  const past = data.rows.filter(({ source }) => source === "LAMPAU");
  const completed = sigerkan.filter(({ status }) => completedStatuses.has(status)).length;
  const active = sigerkan.length - completed;
  const validPast = past.filter(({ status }) => status === "BERLAKU").length;
  const distribution = [...new Set(data.rows.map(({ status }) => status))]
    .map((label) => ({ label, value: data.rows.filter(({ status }) => status === label).length }))
    .sort((a, b) => b.value - a.value);

  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Dashboard Pimpinan</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">Ringkasan Sertifikasi</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">Pantau permohonan sertifikasi yang diproses melalui SIGER-KAN serta riwayat sertifikasi lampau yang dicatat oleh pelaku usaha.</p></div><Link href="/dashboard/certification-summary/report" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-aqua px-5 text-sm font-bold text-navy transition hover:bg-white">Laporan Lengkap <ArrowRight className="h-4 w-4" /></Link></div>
    </header>
    <section aria-label="Indikator sertifikasi" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={ScrollText} label="Total Sertifikasi" value={data.rows.length} detail="Permohonan SIGER-KAN dan sertifikasi lampau" />
      <MetricCard icon={Clock3} label="Dalam Proses" value={active} detail="Permohonan SIGER-KAN yang masih berjalan" tone="warning" />
      <MetricCard icon={CheckCircle2} label="Proses Selesai" value={completed} detail="Audit atau tindakan perbaikan telah selesai" tone="success" />
      <MetricCard icon={History} label="Sertifikasi Lampau" value={past.length} detail="Riwayat yang dicatat oleh pelaku usaha" />
      <MetricCard icon={BadgeCheck} label="Lampau Masih Berlaku" value={validPast} detail="Sertifikasi lampau berstatus berlaku" tone="success" />
    </section>
    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <StatusDistribution title="Distribusi Status Sertifikasi" subtitle="Gabungan status proses SIGER-KAN dan sertifikasi lampau" data={distribution} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Sertifikasi Terbaru</h2><p className="mt-1 text-xs text-muted">Lima data sertifikasi yang terakhir diperbarui.</p></div><Link href="/dashboard/certification-summary/report" className="text-xs font-bold text-ocean">Lihat semua</Link></div>
        <div className="divide-y divide-slate-100">{data.rows.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><BadgeCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-navy">{item.referenceNumber}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-muted">{item.source === "SIGERKAN" ? "SIGER-KAN" : "Lampau"}</span></div><p className="mt-1 truncate text-xs text-muted">{item.businessName} · {item.productName}</p><p className="mt-1 text-[11px] text-muted">{item.submittedOrIssuedAt ? formatExecutiveDate(item.submittedOrIssuedAt) : "Tanggal belum tersedia"}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span></div>)}</div>
        {!data.rows.length && <p className="p-10 text-center text-sm text-muted">Belum ada data sertifikasi.</p>}
      </section>
    </div>
  </div>;
}
