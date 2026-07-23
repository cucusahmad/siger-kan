import Link from "next/link";
import { Beaker, Check, ChevronRight, Clock3, FileCheck2, FlaskConical, PackageCheck, Send, ShieldCheck, UserRoundCheck } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import type { LaboratoryTrackingApplication, LaboratoryTrackingWorkOrder } from "@/features/testing-applications/laboratory-tracking.service";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

interface LaboratoryTrackingProps {
  readonly applications: readonly LaboratoryTrackingApplication[];
}

interface TimelineStep {
  readonly label: string;
  readonly description: string;
  readonly reached: boolean;
  readonly active: boolean;
  readonly date: string | null;
}

const applicationOrder = ["DIAJUKAN", "MENUNGGU_PERSETUJUAN_UPTD", "DISETUJUI", "MENUNGGU_SAMPEL", "SAMPEL_DIKIRIM", "SAMPEL_DITERIMA", "KAJI_ULANG", "DALAM_PENGUJIAN", "SELESAI"] as const;

function formatDate(value: string | null, withTime = false): string {
  if (!value) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", withTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }
    : { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function buildTimeline(application: LaboratoryTrackingApplication): readonly TimelineStep[] {
  const currentIndex = applicationOrder.indexOf(application.status as (typeof applicationOrder)[number]);
  const testingStarted = application.workOrders.some((item) => item.assignedAt !== null);
  const supervisorReview = application.workOrders.length > 0 && application.workOrders.every((item) => item.status === "MENUNGGU_VERIFIKASI_PENYELIA");
  const completed = application.status === "SELESAI";
  return [
    { label: "Permohonan diajukan", description: "Dokumen pengajuan masuk ke layanan laboratorium.", reached: Boolean(application.submittedAt), active: currentIndex <= 1, date: application.submittedAt },
    { label: "Disetujui Kepala UPTD", description: "Permohonan telah memperoleh persetujuan layanan.", reached: Boolean(application.approvedAt), active: application.status === "MENUNGGU_PERSETUJUAN_UPTD", date: application.approvedAt },
    { label: "Sampel diterima", description: "Sampel tiba dan diperiksa oleh petugas penerimaan.", reached: currentIndex >= 5, active: ["MENUNGGU_SAMPEL", "SAMPEL_DIKIRIM"].includes(application.status), date: application.reviewedAt },
    { label: "Kaji ulang penyelia", description: "Kesiapan personel, alat, dan metode pengujian ditentukan.", reached: Boolean(application.sampleReviewedAt), active: application.status === "KAJI_ULANG", date: application.sampleReviewedAt },
    { label: "Pemeriksaan oleh analis", description: "Parameter sampel dikerjakan sesuai Work Order.", reached: testingStarted, active: application.status === "DALAM_PENGUJIAN" && !supervisorReview, date: application.workOrders.find((item) => item.assignedAt)?.assignedAt ?? null },
    { label: "Verifikasi hasil oleh penyelia", description: "Dokumen hasil analis diperiksa dan diverifikasi penyelia.", reached: supervisorReview || completed, active: supervisorReview && !completed, date: application.workOrders.find((item) => item.sentToSupervisorAt)?.sentToSupervisorAt ?? null },
    { label: "Pengujian selesai", description: "Hasil pengujian telah selesai diproses.", reached: completed, active: completed, date: completed ? application.updatedAt : null },
  ];
}

function workOrderLabel(item: LaboratoryTrackingWorkOrder): string {
  if (item.status === "MENUNGGU_PENUGASAN_ANALIS") return "Menunggu penugasan analis";
  if (item.status === "MENUNGGU_PENGIRIMAN_LAB_MITRA") return "Menunggu dikirim ke lab mitra";
  if (item.status === "DALAM_PENGUJIAN") return "Sedang diperiksa analis";
  if (item.status === "MENUNGGU_VERIFIKASI_PENYELIA") return "Menunggu verifikasi penyelia";
  return item.status.replaceAll("_", " ");
}

function progressValue(application: LaboratoryTrackingApplication): number {
  const timeline = buildTimeline(application);
  return Math.round((timeline.filter((item) => item.reached).length / timeline.length) * 100);
}

export function LaboratoryTracking({ applications }: LaboratoryTrackingProps) {
  return <div className="space-y-7">
    <DashboardPageHeader eyebrow="Layanan Laboratorium" title="Tracking Proses Laboratorium" description="Pantau posisi sampel, petugas yang menangani, dan perkembangan setiap parameter pengujian secara transparan." />

    {!applications.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <Beaker className="mx-auto h-11 w-11 text-[#0FA3B1]" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-[#073B4C]">Belum ada proses yang dapat dilacak</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Permohonan yang sudah diajukan akan muncul di halaman ini beserta perkembangan pemeriksaan sampelnya.</p>
      <Link href="/dashboard/permohonan" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073B4C] px-5 py-3 text-sm font-bold text-white">Lihat Permohonan <ChevronRight size={17} /></Link>
    </div> : <div className="space-y-6">{applications.map((application) => {
      const timeline = buildTimeline(application);
      const progress = progressValue(application);
      return <article key={application.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#073B4C] to-[#087E8B] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[.15em] text-cyan-100">{application.applicationNumber}</p><h2 className="mt-2 text-xl font-bold">{application.productName}</h2><p className="mt-1 text-sm text-cyan-50">{application.laboratoryName} · {application.sampleCount} sampel · {application.parameterCount} parameter</p></div>
            <div className="flex items-center gap-3"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">Diperbarui {formatDate(application.updatedAt, true)}</span><Link href={`/dashboard/permohonan/${application.id}`} aria-label={`Lihat detail ${application.applicationNumber}`} className="rounded-xl bg-white p-2.5 text-[#073B4C] transition hover:bg-cyan-50"><ChevronRight size={18} /></Link></div>
          </div>
          <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs font-semibold"><span>Progres keseluruhan</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#61C0BF] transition-all" style={{ width: `${progress}%` }} /></div></div>
        </div>

        <div className="grid gap-7 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.85fr)]">
          <section aria-label={`Alur proses ${application.applicationNumber}`}><div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-[#073B4C]">Alur pemeriksaan sampel</h3><ApplicationStatusBadge status={application.status} /></div>
            <ol className="relative space-y-0">{timeline.map((step, index) => <li key={step.label} className="relative grid grid-cols-[36px_1fr] gap-3 pb-5 last:pb-0">
              {index < timeline.length - 1 && <span className={`absolute left-[17px] top-8 h-[calc(100%-16px)] w-0.5 ${step.reached ? "bg-[#61C0BF]" : "bg-slate-200"}`} />}
              <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${step.reached ? "border-[#087E8B] bg-[#087E8B] text-white" : step.active ? "border-[#F4B942] bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-400"}`}>{step.reached ? <Check size={17} /> : <Clock3 size={16} />}</span>
              <div className="pt-0.5"><div className="flex flex-wrap items-center gap-x-3"><p className={`text-sm font-bold ${step.active || step.reached ? "text-[#073B4C]" : "text-slate-500"}`}>{step.label}</p>{step.active && !step.reached && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Tahap saat ini</span>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{formatDate(step.date, true)}</p></div>
            </li>)}</ol>
          </section>

          <section><h3 className="font-bold text-[#073B4C]">Progres per parameter</h3><p className="mt-1 text-xs leading-5 text-slate-500">Rincian petugas dan posisi pekerjaan untuk setiap pemeriksaan.</p>
            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">{application.workOrders.length ? application.workOrders.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold text-[#087E8B]">{item.number}</p><h4 className="mt-1 text-sm font-bold text-[#073B4C]">{item.parameterName}</h4><p className="mt-1 text-xs text-slate-500">{item.sampleName} · {item.type === "SUBCONTRACT" ? "Lab mitra" : "Lab internal"}</p></div><FlaskConical className="h-5 w-5 shrink-0 text-[#0FA3B1]" /></div>
              <div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-[#073B4C]">{workOrderLabel(item)}</p><div className="mt-2 grid gap-1.5 text-[11px] text-slate-500"><span className="flex items-center gap-2"><UserRoundCheck size={14} /> Analis: {item.analystName || "Belum ditugaskan"}</span><span className="flex items-center gap-2"><ShieldCheck size={14} /> Penyelia: {item.supervisorName || "Belum ditugaskan"}</span>{item.targetCompletionDate && <span className="flex items-center gap-2"><Clock3 size={14} /> Target selesai: {formatDate(item.targetCompletionDate)}</span>}{item.sentToSupervisorAt && <span className="flex items-center gap-2"><Send size={14} /> Dikirim ke penyelia: {formatDate(item.sentToSupervisorAt, true)}</span>}<span className="flex items-center gap-2"><FileCheck2 size={14} /> {item.documentCount} dokumen hasil</span></div></div>
            </div>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-bold text-[#073B4C]">Work Order belum diterbitkan</p><p className="mt-1 text-xs leading-5 text-slate-500">Rincian parameter akan muncul setelah sampel selesai dikaji ulang oleh penyelia.</p></div>}</div>
          </section>
        </div>
      </article>;
    })}</div>}
  </div>;
}
