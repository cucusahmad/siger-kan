import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProductOffersPage } from "@/components/dashboard/business-matching/ProductOffersPage";
import { getProductOfferPageData } from "@/features/product-offers/product-offer.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Penawaran Produk" };

export default async function OffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.permissions.includes("business.read")) {
    return <section className="rounded-3xl border border-[#E63946]/20 bg-white p-8 text-center"><h1 className="text-xl font-bold text-navy">Akses tidak tersedia</h1><p className="mt-2 text-sm text-muted">Akun Anda tidak memiliki izin untuk melihat penawaran.</p></section>;
  }
  const data = await getProductOfferPageData(user.id).catch(() => null);
  return data
    ? <ProductOffersPage initialData={data} />
    : <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-navy">Penawaran belum tersedia</h1><p className="mt-2 text-sm text-muted">Hubungkan akun Anda dengan Pelaku Usaha aktif terlebih dahulu.</p></section>;
}
