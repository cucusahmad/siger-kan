import type { Metadata } from "next";
import { BarChart3, Eye, FileCheck2, FlaskConical, Route, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationStatusBadge } from "@/components/dashboard/testing-applications/ApplicationStatusBadge";
import { listExecutiveTestingReports } from "@/features/testing-applications/executive-testing-report.service";
import { requireTestingReportViewer } from "@/features/testing-applications/testing-application.auth";

export const metadata: Metadata = { title: "Laporan Pengajuan" };

interface Props {
  readonly searchParams: Promise<{ readonly q?: string; readonly status?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  try {
    await requireTestingReportViewer();
  } catch {
    redirect("/dashboard");
  }
  const filters = await searchParams;
  const query = filters.q?.trim().toLocaleLowerCase("id-ID") ?? "";
  const status = filters.status?.trim() ?? "";
  const reports = await listExecutiveTestingReports();
  const items = reports.filter((item) =>
    (!query || [item.applicationNumber, item.businessName, item.productName, item.laboratoryName].some((value) => value.toLocaleLowerCase("id-ID").includes(query)))
    && (!status || item.status === status));
  const completed = reports.filter((item) => item.status === "SELESAI").length;
  const inProgress = reports.filter((item) => item.status === "DALAM_PENGUJIAN").length;
  const withLhu = reports.filter((item) => item.reportNumber).length;

  return <div className="space-y-6">
    <header>
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#087E8B]">Pengajuan Pengujian</p>
      <h1 className="mt-2 text-3xl font-bold text-[#073B4C]">Laporan Pengajuan</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Lihat seluruh pengajuan yang telah dibuat, termasuk dokumen, progres pekerjaan laboratorium, dan penerbitan Laporan Hasil Uji dalam satu tampilan.</p>
    </header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan laporan">
      <Summary icon={<BarChart3 />} label="Total pengajuan" value={reports.length} />
      <Summary icon={<FlaskConical />} label="Dalam pengujian" value={inProgress} />
      <Summary icon={<FileCheck2 />} label="Pengujian selesai" value={completed} />
      <Summary icon={<FileCheck2 />} label="LHU tersedia" value={withLhu} />
    </section>
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_260px_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" defaultValue={filters.q} aria-label="Cari laporan" placeholder="Cari nomor, usaha, produk, atau laboratorium" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" /></label>
      <select name="status" defaultValue={status} aria-label="Filter status" className="rounded-xl border border-slate-200 px-3 text-sm">
        <option value="">Semua status</option>
        {["DIAJUKAN", "MENUNGGU_PERSETUJUAN_UPTD", "DISETUJUI", "MENUNGGU_SAMPEL", "SAMPEL_DIKIRIM", "SAMPEL_DITERIMA", "KAJI_ULANG", "DALAM_PENGUJIAN", "SELESAI", "DITOLAK"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
      <button className="rounded-xl bg-[#073B4C] px-5 py-2.5 text-sm font-bold text-white">Terapkan Filter</button>
    </form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {!items.length ? <div className="p-14 text-center text-sm text-slate-500">Tidak ada pengajuan yang sesuai dengan filter.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Pengajuan</th><th className="px-4 py-4">Pelaku usaha</th><th className="px-4 py-4">Produk & laboratorium</th><th className="px-4 py-4">Cakupan</th><th className="px-4 py-4">Progres hasil</th><th className="px-4 py-4">Status</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="align-top transition hover:bg-slate-50/70">
          <td className="px-5 py-4"><p className="font-bold text-[#073B4C]">{item.applicationNumber}</p><p className="mt-1 text-xs text-slate-400">{formatDate(item.submittedAt)}</p></td>
          <td className="px-4 py-4 font-semibold text-slate-700">{item.businessName}</td>
          <td className="px-4 py-4"><p className="font-semibold text-slate-700">{item.productName}</p><p className="mt-1 text-xs text-slate-500">{item.laboratoryName}</p></td>
          <td className="px-4 py-4 text-xs leading-5 text-slate-600">{item.sampleCount} sampel<br />{item.parameterCount} parameter · {item.documentCount} dokumen</td>
          <td className="px-4 py-4"><p className="font-semibold text-slate-700">{item.completedWorkOrderCount}/{item.workOrderCount} hasil terverifikasi</p><p className="mt-1 text-xs text-slate-500">{item.reportNumber ? `LHU ${item.reportNumber}` : "LHU belum tersedia"}</p></td>
          <td className="px-4 py-4"><ApplicationStatusBadge status={item.status} /></td>
          <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/dashboard/reports/${item.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#087E8B] hover:bg-cyan-50"><Eye size={15} /> Detail</Link><Link href={`/dashboard/reports/${item.id}#tracking`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#073B4C] px-3 py-2 text-xs font-bold text-white hover:bg-[#087E8B]"><Route size={15} /> Tracking</Link></div></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Menampilkan {items.length} dari {reports.length} pengajuan</div>
    </section>
  </div>;
}

function Summary({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#073B4C]">{value}</p></div><span className="rounded-xl bg-cyan-50 p-3 text-[#087E8B]">{icon}</span></div></article>;
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "Belum diajukan";
}
