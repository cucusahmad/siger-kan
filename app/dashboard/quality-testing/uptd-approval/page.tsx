import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUptdHead } from "@/features/testing-applications/testing-application.auth";
import { listUptdApprovalApplications } from "@/features/testing-applications/testing-application.service";

interface Item { readonly id: string; readonly applicationNumber: string | null; readonly reviewedAt: string | null; readonly businessProfile: { readonly business: { readonly name: string } }; readonly laboratory: { readonly name: string } | null; readonly product: { readonly productName: string | null } | null }

export default async function UptdApprovalPage({ searchParams }: { readonly searchParams: Promise<{ readonly updated?: string }> }) {
  try { await requireUptdHead(); } catch { redirect("/dashboard"); }
  const [items, query] = await Promise.all([listUptdApprovalApplications() as Promise<readonly Item[]>, searchParams]);
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-[#087E8B]">Pengujian Mutu</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Persetujuan Kepala UPTD</h1><p className="mt-2 text-sm text-slate-500">Permohonan yang telah lolos verifikasi petugas dan menunggu keputusan.</p></header>{query.updated === "1" && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Keputusan berhasil disimpan.</p>}<section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{items.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Tidak ada permohonan yang menunggu persetujuan.</p> : items.map((item) => <article key={item.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold text-[#087E8B]">{item.applicationNumber}</p><h2 className="mt-1 font-bold text-[#073B4C]">{item.businessProfile.business.name}</h2><p className="mt-1 text-sm text-slate-500">{item.product?.productName ?? "Produk belum diberi nama"} · {item.laboratory?.name ?? "Laboratorium belum dipilih"}</p></div><Link href={`/dashboard/quality-testing/uptd-approval/${item.id}`} className="rounded-xl bg-[#073B4C] px-4 py-2.5 text-center text-sm font-bold text-white">Tinjau</Link></article>)}</section></div>;
}
