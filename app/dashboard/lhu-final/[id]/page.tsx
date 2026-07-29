import type { Metadata } from "next";
import { ArrowLeft, Download, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBusinessFinalLaboratoryReport } from "@/features/testing-applications/final-laboratory-report.service";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Detail LHU Final" };
interface Props { readonly params: Promise<{ readonly id: string }> }

export default async function FinalReportDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roleCodes.includes("PELAKU_USAHA")) redirect("/dashboard");
  const membership = await resolveCurrentBusiness(user.id);
  if (!membership) redirect("/dashboard");
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const report = await getBusinessFinalLaboratoryReport(user.id, id).catch(() => notFound());
  const purpose = report.application.otherPurpose || report.application.purpose?.replaceAll("_", " ") || "-";

  return <div className="space-y-6">
    <header>
      <Link href="/dashboard/lhu-final" className="inline-flex items-center gap-2 text-sm font-bold text-[#087E8B]"><ArrowLeft size={16} /> Kembali ke LHU Final</Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-bold text-[#087E8B]">{report.reportNumber}</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Ringkasan LHU Final</h1><p className="mt-2 text-sm text-slate-500">{report.application.applicationNumber}</p></div>
        <a href={`/api/laboratory-reports/${report.id}/final-file`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#073B4C] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#087E8B]"><Download size={18} /> Unduh LHU Final</a>
      </div>
    </header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <main className="space-y-5">
        <Section title="Ringkasan Pengajuan"><dl className="grid gap-4 sm:grid-cols-2"><Info label="Nomor Pengajuan" value={report.application.applicationNumber} /><Info label="Tujuan Pengujian" value={purpose} /><Info label="Produk" value={report.application.product?.productName} /><Info label="Jenis Produk" value={report.application.product?.productType} /><Info label="Bentuk Produk" value={report.application.product?.productForm?.replaceAll("_", " ")} /><Info label="Laboratorium" value={report.application.laboratory?.name} /></dl></Section>
        <Section title={`Sampel (${report.application.samples.length})`}><div className="divide-y divide-slate-100">{report.application.samples.map((sample) => <div key={sample.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><strong className="text-slate-700">{sample.sampleName || "-"}</strong><span className="text-slate-500">{sample.quantity ?? "-"} sampel · {sample.weight ?? "-"} {sample.weightUnit || ""}</span></div>)}</div></Section>
        <Section title={`Parameter Pengujian (${report.application.parameters.length})`}><div className="divide-y divide-slate-100">{report.application.parameters.map((parameter) => <div key={parameter.id} className="py-3"><p className="text-sm font-semibold text-slate-700">{parameter.parameter.name}</p><p className="mt-1 text-xs text-slate-500">Sampel: {parameter.sample.sampleName || "-"} · Metode: {parameter.parameter.method || "-"}</p></div>)}</div></Section>
        <Section title="Kesimpulan"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.conclusion}</p>{report.notes && <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">{report.notes}</p>}</Section>
      </main>
      <aside className="h-fit rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <FileCheck2 className="h-9 w-9 text-[#2E9F6B]" />
        <h2 className="mt-3 font-bold text-[#073B4C]">Dokumen telah diterbitkan</h2>
        <dl className="mt-4 space-y-3"><Info label="Tanggal LHU" value={formatDate(report.reportDate)} /><Info label="Tanggal Terbit" value={report.publishedAt ? formatDate(report.publishedAt) : "-"} /><Info label="Nama File" value={report.finalFileName} /><Info label="Ukuran File" value={formatFileSize(report.finalFileSize)} /></dl>
        <a href={`/api/laboratory-reports/${report.id}/final-file`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073B4C] px-4 py-3 text-sm font-bold text-white"><Download size={17} /> Unduh {report.finalFileName}</a>
      </aside>
    </div>
  </div>;
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold text-[#073B4C]">{title}</h2>{children}</section>;
}
function Info({ label, value }: { readonly label: string; readonly value?: string | null }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{value || "-"}</dd></div>;
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}
function formatFileSize(value: string | null): string {
  if (!value) return "-";
  const bytes = Number(value);
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
