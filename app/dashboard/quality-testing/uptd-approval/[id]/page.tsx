import { redirect } from "next/navigation";
import { UptdApprovalForm } from "@/components/dashboard/testing-applications/UptdApprovalForm";
import { requireUptdHead } from "@/features/testing-applications/testing-application.auth";
import { getReceptionApplication } from "@/features/testing-applications/testing-application.service";

interface Detail { readonly applicationNumber: string | null; readonly status: string; readonly businessProfile: { readonly business: { readonly name: string } }; readonly product: { readonly productName: string | null; readonly productType: string | null } | null; readonly laboratory: { readonly name: string } | null; readonly samples: readonly { readonly id: string }[] }

export default async function UptdApprovalDetailPage({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  try { await requireUptdHead(); } catch { redirect("/dashboard"); }
  const { id } = await params; const item = await getReceptionApplication(id) as Detail;
  if (item.status !== "MENUNGGU_PERSETUJUAN_UPTD") redirect("/dashboard/quality-testing/uptd-approval");
  return <div className="space-y-6"><header><p className="text-sm font-bold text-[#087E8B]">{item.applicationNumber}</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Tinjau Permohonan</h1></header><section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"><Info label="Pelaku usaha" value={item.businessProfile.business.name}/><Info label="Produk" value={item.product?.productName}/><Info label="Jenis produk" value={item.product?.productType}/><Info label="Laboratorium" value={item.laboratory?.name}/><Info label="Jumlah data sampel" value={`${item.samples.length} sampel`}/></section><UptdApprovalForm applicationId={id}/></div>;
}
function Info({ label, value }: { readonly label: string; readonly value?: string | null }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value || "-"}</p></div>; }
