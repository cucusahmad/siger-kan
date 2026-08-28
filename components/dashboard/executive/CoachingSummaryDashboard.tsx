import { ArrowRight, CheckCircle2, Clock3, HeartHandshake, MessagesSquare } from "lucide-react";
import Link from "next/link";

import { CoachingActivityType, type CoachingSummaryData } from "@/features/executive-dashboard/coaching-summary.types";

import { formatExecutiveDate, humanizeStatus, MetricCard, statusClass } from "./ExecutiveSummaryUi";

const finalStatuses = ["COMPLETED", "CLOSED"];

export function CoachingSummaryDashboard({ data }: { readonly data: CoachingSummaryData }) {
  const completed = data.activities.filter(({ status }) => finalStatuses.includes(status)).length;
  const inProgress = data.activities.length - completed;
  const clinics = data.activities.filter(({ type }) => type === CoachingActivityType.QUALITY_CLINIC).length;
  const consultations = data.activities.length - clinics;

  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9"><p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Dashboard Pimpinan</p><div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">Ringkasan Pembinaan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Pantau pelaksanaan Klinik Mutu dan Konsultasi Daring dalam satu laporan pembinaan terpadu.</p></div><Link href="/dashboard/coaching-summary/report" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-aqua px-5 text-sm font-bold text-navy transition hover:bg-white">Laporan Lengkap <ArrowRight className="h-4 w-4" /></Link></div></header>
    <section aria-label="Indikator pembinaan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard icon={HeartHandshake} label="Total Pembinaan" value={data.activities.length} detail="Seluruh kegiatan pembinaan" /><MetricCard icon={Clock3} label="Dalam Proses" value={inProgress} detail="Kegiatan yang masih ditangani" tone="warning" /><MetricCard icon={CheckCircle2} label="Selesai" value={completed} detail="Kegiatan yang telah dituntaskan" tone="success" /><MetricCard icon={HeartHandshake} label="Klinik Mutu" value={clinics} detail="Pertemuan pembinaan mutu" /><MetricCard icon={MessagesSquare} label="Konsultasi Daring" value={consultations} detail="Konsultasi melalui sistem" /></section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Kegiatan Pembinaan Terbaru</h2><p className="mt-1 text-xs text-muted">Lima kegiatan terbaru dari kedua layanan.</p></div><Link href="/dashboard/coaching-summary/report" className="text-xs font-bold text-ocean">Lihat semua</Link></div><div className="divide-y divide-slate-100">{data.activities.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean">{item.type === CoachingActivityType.QUALITY_CLINIC ? <HeartHandshake className="h-5 w-5" /> : <MessagesSquare className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="font-bold text-navy">{item.title}</p><p className="mt-1 truncate text-xs text-muted">{item.businessName} · {item.type === CoachingActivityType.QUALITY_CLINIC ? "Klinik Mutu" : "Konsultasi Daring"}</p><p className="mt-1 text-[11px] text-muted">{formatExecutiveDate(item.createdAt)}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span></div>)}</div>{!data.activities.length && <p className="p-10 text-center text-sm text-muted">Belum ada kegiatan pembinaan.</p>}</section>
  </div>;
}
