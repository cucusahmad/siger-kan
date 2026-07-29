import type { Metadata } from "next";
import { PackageCheck, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductStatus } from "@/app/generated/prisma/client";
import { canVerifyProducts, listProductsForVerification } from "@/features/products/product-verification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Verifikasi Produk" };

interface PageProps {
  readonly searchParams: Promise<{ readonly status?: string; readonly q?: string }>;
}

const filters = [
  { value: ProductStatus.PENDING_VERIFICATION, label: "Menunggu" },
  { value: ProductStatus.VERIFIED, label: "Terverifikasi" },
  { value: ProductStatus.REVISION_REQUIRED, label: "Perlu Perbaikan" },
  { value: ProductStatus.REJECTED, label: "Ditolak" },
] as const;

export default async function ProductVerificationPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canVerifyProducts(user)) redirect("/dashboard");
  const params = await searchParams;
  const status = Object.values(ProductStatus).includes(params.status as ProductStatus) ? params.status as ProductStatus : ProductStatus.PENDING_VERIFICATION;
  const data = await listProductsForVerification(user, status);
  const needle = params.q?.trim().toLocaleLowerCase("id") ?? "";
  const products = needle ? data.products.filter((item) => [item.name, item.businessName, item.commodityName, item.categoryName].some((value) => value.toLocaleLowerCase("id").includes(needle))) : data.products;

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Product Management · Admin Dinas</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Verifikasi Produk</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Periksa kelengkapan produk pelaku usaha sebelum produk dapat dipublikasikan pada katalog dan Business Matching.</p></div><div className="rounded-2xl bg-white/10 p-4 text-center"><strong className="block text-3xl">{data.counts.PENDING_VERIFICATION ?? 0}</strong><span className="text-xs text-white/70">Menunggu verifikasi</span></div></div></section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{filters.map((filter) => <Link key={filter.value} href={`/dashboard/product-verification?status=${filter.value}`} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${status === filter.value ? "bg-[#087E8B] text-white" : "bg-slate-100 text-slate-600"}`}>{filter.label} ({data.counts[filter.value] ?? 0})</Link>)}</div><form className="relative w-full lg:max-w-xs"><input type="hidden" name="status" value={status} /><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input name="q" defaultValue={params.q} placeholder="Cari produk atau usaha..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#0FA3B1]" /></form></div></section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Produk</th><th className="px-5 py-4">Pelaku Usaha</th><th className="px-5 py-4">Klasifikasi</th><th className="px-5 py-4">Diajukan</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><strong className="block text-[#073B4C]">{product.name}</strong><span className="mt-1 block text-xs text-slate-500">{product.brandName || "Tanpa merek"} {product.sku ? `· ${product.sku}` : ""}</span></td><td className="px-5 py-4"><strong className="block text-slate-700">{product.businessName}</strong><span className="text-xs text-slate-500">{product.businessCode}</span></td><td className="px-5 py-4 text-xs text-slate-600">{product.commodityName}<br />{product.categoryName}</td><td className="px-5 py-4 text-xs text-slate-600">{product.submittedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(product.submittedAt)) : "—"}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/product-verification/${product.id}`} className="inline-flex rounded-xl bg-[#087E8B] px-4 py-2.5 text-xs font-bold text-white">{status === ProductStatus.PENDING_VERIFICATION ? "Periksa" : "Lihat Detail"}</Link></td></tr>)}{products.length === 0 && <tr><td colSpan={5} className="px-5 py-16 text-center"><PackageCheck className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-[#073B4C]">Tidak ada produk</p><p className="mt-1 text-xs text-slate-500">Tidak ada produk pada status atau pencarian ini.</p></td></tr>}</tbody></table></div></section>
  </div>;
}

