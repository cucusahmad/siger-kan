import { ArrowLeft, ExternalLink, FileText, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ResultVerificationForm } from "@/components/dashboard/testing-applications/ResultVerificationForm";
import { requireLaboratorySupervisor } from "@/features/testing-applications/testing-application.auth";
import { getWorkOrder } from "@/features/testing-applications/work-order.service";

interface Props { readonly params: Promise<{ readonly id: string }> }
interface Item { readonly id: string; readonly workOrderNumber: string; readonly status: string; readonly analystNotes: string | null; readonly testingMethod: string | null; readonly sentToSupervisorAt: string | null; readonly analyst: { readonly profile: { readonly fullName: string } | null } | null; readonly application: { readonly applicationNumber: string; readonly businessProfile: { readonly business: { readonly name: string } } }; readonly applicationParameter: { readonly parameter: { readonly name: string; readonly method: string | null }; readonly sample: { readonly sampleName: string | null } }; readonly documents: readonly { readonly id: string; readonly type: string; readonly fileName: string; readonly fileSize: string; readonly uploadedAt: string }[] }

export default async function ResultVerificationDetailPage({ params }: Props) {
  try { await requireLaboratorySupervisor(); } catch { redirect("/dashboard"); }
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let item: Item;
  try { item = await getWorkOrder(id) as Item; } catch (error) { if (error instanceof Error && error.message === "NOT_FOUND") notFound(); throw error; }
  if (item.status !== "MENUNGGU_VERIFIKASI_PENYELIA") redirect("/dashboard/quality-testing/result-verification");
  return <div className="space-y-6"><header><Link href="/dashboard/quality-testing/result-verification" className="inline-flex items-center gap-2 text-sm font-bold text-[#087E8B]"><ArrowLeft size={16} /> Kembali</Link><p className="mt-4 text-sm font-bold text-[#087E8B]">{item.workOrderNumber} · {item.application.applicationNumber}</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">{item.applicationParameter.parameter.name}</h1><p className="mt-2 text-sm text-slate-500">{item.application.businessProfile.business.name} · Sampel {item.applicationParameter.sample.sampleName || "-"}</p></header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"><main className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-[#073B4C]"><UserRound size={18} /> Ringkasan Analis</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Info label="Analis" value={item.analyst?.profile?.fullName} /><Info label="Metode" value={item.testingMethod || item.applicationParameter.parameter.method} /></dl><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Catatan analis</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.analystNotes || "Tidak ada catatan."}</p></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-[#073B4C]"><FileText size={18} /> Dokumen Hasil ({item.documents.length})</h2><div className="mt-4 space-y-3">{item.documents.map((document) => <article key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-700">{document.fileName}</p><p className="mt-1 text-xs text-slate-500">{document.type.replaceAll("_", " ")} · {(Number(document.fileSize) / 1_048_576).toFixed(1)} MB</p></div><a href={`/api/work-orders/${id}/documents?documentId=${document.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#087E8B]/30 px-3 text-sm font-bold text-[#087E8B]"><ExternalLink size={16} /> Lihat File</a></article>)}</div></section></main>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#073B4C]">Keputusan Verifikasi</h2><p className="mb-5 mt-2 text-sm leading-6 text-slate-500">Pastikan dokumen dan catatan analis telah sesuai. Hasil yang dikembalikan akan aktif kembali pada akun analis.</p><ResultVerificationForm workOrderId={id} /></aside></div></div>;
}

function Info({ label, value }: { readonly label: string; readonly value?: string | null }) { return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{value || "-"}</dd></div>; }
