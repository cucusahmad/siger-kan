import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ProductCatalogPage } from "@/components/dashboard/business-matching/ProductCatalogPage";
import { getProductCatalogData } from "@/features/product-catalog/product-catalog.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Katalog Produk" };

export default async function CatalogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.permissions.includes("business.read")) return <AccessDenied />;
  const data = await getProductCatalogData(user.id, user.permissions.includes("business.update")).catch(() => null);
  return data ? <ProductCatalogPage initialData={data} /> : <NoBusiness />;
}

function AccessDenied() {
  return <section className="rounded-3xl border border-[#E63946]/20 bg-white p-8 text-center"><h1 className="text-xl font-bold text-navy">Akses tidak tersedia</h1><p className="mt-2 text-sm text-muted">Akun Anda tidak memiliki izin untuk melihat katalog produk.</p></section>;
}

function NoBusiness() {
  return <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white p-8 text-center"><Building2 className="h-10 w-10 text-ocean" /><h1 className="mt-5 text-xl font-bold text-navy">Belum ada usaha terhubung</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted">Hubungkan akun dengan Pelaku Usaha aktif untuk mengakses katalog dan penawaran.</p><Link href="/dashboard" className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Kembali ke Dashboard</Link></section>;
}
