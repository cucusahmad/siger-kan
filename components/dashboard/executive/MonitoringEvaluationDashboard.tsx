import { ArrowRight, BadgeCheck, Building2, CheckCircle2, CircleAlert, ClipboardCheck, FlaskConical, PackageCheck } from "lucide-react";
import Link from "next/link";

import type { CertificationSummaryData } from "@/features/executive-dashboard/certification-summary.types";
import type { ExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.types";

import { formatExecutiveDate, humanizeStatus, MetricCard, StatusDistribution, statusClass } from "./ExecutiveSummaryUi";

interface MonitoringEvaluationDashboardProps {
  readonly data: ExecutiveDashboardData;
  readonly certificationData: CertificationSummaryData;
}
interface FollowUpItem { readonly id: string; readonly title: string; readonly description: string; readonly status: string; readonly href: string; readonly category: string; readonly date: string | null; }

const completedTestingStatuses = new Set(["SELESAI"]);
const completedCertificationStatuses = new Set(["AUDIT_COMPLETED", "CORRECTIVE_ACTION_VERIFIED"]);
const rejectedStatuses = new Set(["DITOLAK", "REJECTED"]);

export function MonitoringEvaluationDashboard({ data, certificationData }: MonitoringEvaluationDashboardProps) {
  const activeBusinesses = data.businesses.filter(({ status }) => status === "ACTIVE").length;
  const verifiedProducts = data.products.filter(({ status }) => status === "VERIFIED").length;
  const completedTesting = data.testing.filter(({ status }) => completedTestingStatuses.has(status)).length;
  const pendingTesting = data.testing.filter(({ status }) => !completedTestingStatuses.has(status) && !rejectedStatuses.has(status)).length;
  const acceptedMatches = data.matches.filter(({ status }) => status === "ACCEPTED").length;
  const certificationApplications = certificationData.rows.filter(({ source }) => source === "SIGERKAN");
  const completedCertifications = certificationApplications.filter(({ status }) => completedCertificationStatuses.has(status)).length;
  const pendingCertifications = certificationApplications.filter(({ status }) => !completedCertificationStatuses.has(status) && !rejectedStatuses.has(status)).length;
  const testingCompletionRate = percentage(completedTesting, data.testing.length);
  const productVerificationRate = percentage(verifiedProducts, data.products.length);
  const businessActivationRate = percentage(activeBusinesses, data.businesses.length);
  const matchingSuccessRate = percentage(acceptedMatches, data.matches.length);
  const certificationCompletionRate = percentage(completedCertifications, certificationApplications.length);
  const certificationDistribution = [...new Set(certificationApplications.map(({ status }) => status))]
    .map((label) => ({ label, value: certificationApplications.filter(({ status }) => status === label).length }))
    .sort((a, b) => b.value - a.value);

  const followUps: readonly FollowUpItem[] = [
    ...data.testing.filter(({ status }) => !completedTestingStatuses.has(status) && !rejectedStatuses.has(status)).slice(0, 5).map((item) => ({
      id: `testing-${item.id}`, title: item.applicationNumber, description: `${item.businessName} · ${item.productName}`,
      status: item.status, href: `/dashboard/reports/${item.id}`, category: "Pengujian Mutu", date: item.submittedAt,
    })),
    ...certificationApplications.filter(({ status }) => !completedCertificationStatuses.has(status) && !rejectedStatuses.has(status)).slice(0, 3).map((item) => ({
      id: `certification-${item.id}`, title: item.referenceNumber, description: `${item.businessName} · ${item.productName}`,
      status: item.status, href: "/dashboard/certification-summary/report", category: "Sertifikasi", date: item.submittedOrIssuedAt,
    })),
    ...data.businesses.filter(({ status }) => status !== "ACTIVE").slice(0, 3).map((item) => ({
      id: `business-${item.id}`, title: item.name, description: `${item.code} · ${item.region}`,
      status: item.status, href: `/dashboard/pelaku-usaha/${item.id}`, category: "Pelaku Usaha", date: item.registeredAt,
    })),
  ].slice(0, 8);

  return <div className="space-y-7">
    <header className="overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[0_18px_55px_rgba(7,59,76,.18)] sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Ruang Kendali Pimpinan</p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">Monitoring dan Evaluasi</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Pantau capaian layanan, identifikasi pekerjaan yang memerlukan perhatian, dan buka laporan rinci sebagai dasar evaluasi.</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/75">Diperbarui {formatDateTime(data.generatedAt)}</span><Link href="/dashboard/executive-report" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aqua px-5 text-sm font-bold text-navy transition hover:bg-white">Laporan Eksekutif <ArrowRight className="h-4 w-4" /></Link></div></div>
    </header>

    <section aria-label="Indikator monitoring" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <MetricCard icon={Building2} label="Pelaku Usaha Aktif" value={activeBusinesses} detail={`${businessActivationRate}% dari ${data.businesses.length.toLocaleString("id-ID")} pelaku usaha`} tone="success" />
      <MetricCard icon={PackageCheck} label="Produk Terverifikasi" value={verifiedProducts} detail={`${productVerificationRate}% dari seluruh produk`} tone="success" />
      <MetricCard icon={FlaskConical} label="Pengujian Diproses" value={pendingTesting} detail="Pengajuan yang masih memerlukan penyelesaian" tone="warning" />
      <MetricCard icon={CheckCircle2} label="Penyelesaian Uji" value={`${testingCompletionRate}%`} detail={`${completedTesting} pengujian telah selesai`} />
      <MetricCard icon={ClipboardCheck} label="Keberhasilan Matching" value={`${matchingSuccessRate}%`} detail={`${acceptedMatches} penawaran telah diterima`} />
      <MetricCard icon={BadgeCheck} label="Sertifikasi Diproses" value={pendingCertifications} detail={`${certificationCompletionRate}% dari permohonan telah selesai`} tone="warning" />
    </section>

    <section aria-labelledby="evaluation-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-ocean">Evaluasi Capaian</p><h2 id="evaluation-title" className="mt-2 text-lg font-bold text-navy">Indikator Kinerja Layanan</h2></div><p className="text-xs text-muted">Persentase dihitung dari data layanan saat ini.</p></div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5"><EvaluationIndicator label="Aktivasi Pelaku Usaha" value={businessActivationRate} /><EvaluationIndicator label="Verifikasi Produk" value={productVerificationRate} /><EvaluationIndicator label="Penyelesaian Pengujian" value={testingCompletionRate} /><EvaluationIndicator label="Penyelesaian Sertifikasi" value={certificationCompletionRate} /><EvaluationIndicator label="Business Matching Diterima" value={matchingSuccessRate} /></div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[.7fr_.7fr_1.2fr]">
      <StatusDistribution title="Pipeline Pengujian Mutu" subtitle="Distribusi posisi seluruh permohonan pengujian" data={data.testingPipeline} />
      <StatusDistribution title="Pipeline Sertifikasi" subtitle="Distribusi posisi permohonan sertifikasi SIGER-KAN" data={certificationDistribution} />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6"><div><h2 className="text-lg font-bold text-navy">Tindak Lanjut Prioritas</h2><p className="mt-1 text-xs text-muted">Layanan aktif dan data usaha yang memerlukan perhatian pimpinan.</p></div><CircleAlert className="h-5 w-5 shrink-0 text-gold" /></div>
        <div className="divide-y divide-slate-100">{followUps.map((item) => <Link key={item.id} href={item.href} className="group flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7E2] text-[#8A6411]"><CircleAlert className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-navy">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-muted">{item.category}</span></div><p className="mt-1 truncate text-xs text-muted">{item.description}</p>{item.date && <p className="mt-1 text-[11px] text-muted">{formatExecutiveDate(item.date)}</p>}</div><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span><ArrowRight className="hidden h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-ocean sm:block" /></Link>)}</div>
        {!followUps.length && <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-[#2E9F6B]" /><p className="mt-3 text-sm font-bold text-navy">Tidak ada tindak lanjut prioritas</p><p className="mt-1 text-xs text-muted">Seluruh layanan yang dipantau telah terselesaikan.</p></div>}
      </section>
    </div>
  </div>;
}

function EvaluationIndicator({ label, value }: { readonly label: string; readonly value: number }) {
  const tone = value >= 80 ? "bg-[#2E9F6B]" : value >= 50 ? "bg-[#F4B942]" : "bg-[#E63946]";
  const evaluation = value >= 80 ? "Baik" : value >= 50 ? "Perlu perhatian" : "Perlu tindak lanjut";
  return <article className="rounded-2xl bg-slate-50 p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-navy">{label}</p><span className="text-xl font-bold text-navy">{value}%</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} /></div><p className="mt-3 text-xs font-semibold text-muted">{evaluation}</p></article>;
}

function percentage(value: number, total: number): number { return total ? Math.round((value / total) * 100) : 0; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
