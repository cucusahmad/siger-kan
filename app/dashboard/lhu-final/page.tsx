import type { Metadata } from "next";
import { Download, Eye, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listBusinessFinalLaboratoryReports } from "@/features/testing-applications/final-laboratory-report.service";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "LHU Final" };

export default async function FinalReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roleCodes.includes("PELAKU_USAHA")) redirect("/dashboard");
  const membership = await resolveCurrentBusiness(user.id);
  if (!membership) redirect("/dashboard");
  const reports = await listBusinessFinalLaboratoryReports(user.id);

  return <div className="space-y-6">
    <header>
      <p className="text-xs font-bold uppercase tracking-widest text-[#087E8B]">Dokumen Hasil Pengujian</p>
      <h1 className="mt-2 text-3xl font-bold text-[#073B4C]">LHU Final</h1>
      <p className="mt-2 text-sm text-slate-500">Lihat dan unduh Laporan Hasil Uji final yang telah diterbitkan untuk usaha Anda.</p>
    </header>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {!reports.length ? <div className="p-14 text-center">
        <FileCheck2 className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 font-bold text-[#073B4C]">Belum ada LHU final</h2>
        <p className="mt-2 text-sm text-slate-500">LHU akan tampil di sini setelah dokumen final diterbitkan oleh laboratorium.</p>
      </div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Nomor LHU", "Nomor Pengajuan", "Produk", "Laboratorium", "Tanggal Terbit", "Aksi"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
          <tbody>{reports.map((report) => <tr key={report.id} className="border-t border-slate-100">
            <td className="px-5 py-4 font-semibold text-[#073B4C]">{report.reportNumber}</td>
            <td className="px-5 py-4">{report.application.applicationNumber}</td>
            <td className="px-5 py-4">{report.application.product?.productName || "-"}</td>
            <td className="px-5 py-4">{report.application.laboratory?.name || "-"}</td>
            <td className="px-5 py-4">{formatDate(report.publishedAt || report.reportDate)}</td>
            <td className="px-5 py-4"><div className="flex items-center gap-2">
              <Link href={`/dashboard/lhu-final/${report.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-bold text-[#087E8B] transition hover:bg-cyan-50"><Eye size={16} /> Detail</Link>
              <a href={`/api/laboratory-reports/${report.id}/final-file`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#073B4C] px-3 py-2 font-bold text-white transition hover:bg-[#087E8B]"><Download size={16} /> Unduh</a>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </div>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}
