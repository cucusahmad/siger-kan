import type { Metadata } from "next";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireLaboratorySupervisor } from "@/features/testing-applications/testing-application.auth";
import { listPendingResultVerifications } from "@/features/testing-applications/work-order.service";

export const metadata: Metadata = { title: "Verifikasi Hasil" };
interface Item { readonly id: string; readonly workOrderNumber: string; readonly sentToSupervisorAt: string | null; readonly analyst: { readonly profile: { readonly fullName: string } | null } | null; readonly application: { readonly applicationNumber: string; readonly businessProfile: { readonly business: { readonly name: string } } }; readonly applicationParameter: { readonly parameter: { readonly name: string }; readonly sample: { readonly sampleName: string | null } }; readonly documents: readonly unknown[] }

export default async function ResultVerificationPage() {
  try { await requireLaboratorySupervisor(); } catch { redirect("/dashboard"); }
  const items = await listPendingResultVerifications() as readonly Item[];
  return <div className="space-y-6"><header><p className="text-sm font-bold text-[#087E8B]">Layanan Laboratorium</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Verifikasi Hasil</h1><p className="mt-2 text-sm text-slate-500">Periksa dokumen hasil analis sebelum disetujui atau dikembalikan untuk pengujian ulang.</p></header>
    <div className="grid gap-4">{items.map((item) => <Link key={item.id} href={`/dashboard/quality-testing/result-verification/${item.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#087E8B]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-[#087E8B]">{item.workOrderNumber} · {item.application.applicationNumber}</p><h2 className="mt-2 font-bold text-[#073B4C]">{item.applicationParameter.parameter.name}</h2><p className="mt-1 text-sm text-slate-500">{item.application.businessProfile.business.name} · Sampel {item.applicationParameter.sample.sampleName || "-"}</p><p className="mt-2 text-xs text-slate-400">Analis: {item.analyst?.profile?.fullName || "-"} · {item.documents.length} dokumen</p></div><ChevronRight className="mt-2 text-slate-400 transition group-hover:text-[#087E8B]" size={20} /></div></Link>)}
      {!items.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><ClipboardCheck className="mx-auto text-[#0FA3B1]" size={42} /><h2 className="mt-4 font-bold text-[#073B4C]">Tidak ada hasil yang menunggu verifikasi</h2><p className="mt-2 text-sm text-slate-500">Hasil yang dikirim analis akan muncul di halaman ini.</p></div>}
    </div></div>;
}
