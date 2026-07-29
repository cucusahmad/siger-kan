import type { Metadata } from "next";
import { ArrowLeft, Building2, PackageCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductStatus } from "@/app/generated/prisma/client";
import { ProductVerificationDecision } from "@/components/dashboard/products/ProductVerificationDecision";
import { canVerifyProducts, getProductForVerification } from "@/features/products/product-verification.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Detail Verifikasi Produk" };

interface PageProps {
  readonly params: Promise<{ readonly productId: string }>;
}

const availability = { READY_STOCK: "Stok tersedia", PREORDER: "Pre-order", SEASONAL: "Musiman", OUT_OF_STOCK: "Stok habis" } as const;
const period = { DAILY: "hari", WEEKLY: "minggu", MONTHLY: "bulan", YEARLY: "tahun" } as const;

export default async function ProductVerificationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canVerifyProducts(user)) redirect("/dashboard");
  const { productId } = await params;
  let product: Awaited<ReturnType<typeof getProductForVerification>>;
  try {
    product = await getProductForVerification(user, productId);
  } catch {
    notFound();
  }

  return <div className="space-y-6">
    <Link href="/dashboard/product-verification" className="inline-flex items-center gap-2 text-sm font-bold text-[#087E8B]"><ArrowLeft size={17} /> Kembali ke antrean</Link>
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">{product.commodityName} · {product.categoryName}</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{product.name}</h1><p className="mt-2 text-sm text-white/70">{product.brandName || "Tanpa merek"} {product.sku ? `· SKU ${product.sku}` : ""}</p></div><span className="w-fit rounded-full bg-white/10 px-4 py-2 text-xs font-bold">{statusLabel(product.status)}</span></div></section>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-[#073B4C]">Galeri Produk</h2>{product.images.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{product.images.map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100"><Image src={image.url} alt={image.altText ?? product.name} fill unoptimized className="object-cover" />{image.isPrimary && <span className="absolute bottom-2 left-2 rounded-md bg-[#073B4C] px-2 py-1 text-[10px] font-bold text-white">Gambar utama</span>}</div>)}</div> : <div className="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">Belum ada gambar produk</div>}</section>
      <Section title="Narasi Produk"><Detail label="Ringkasan" value={product.shortDescription} /><Detail label="Deskripsi lengkap" value={product.description} wide /><Detail label="Kemasan" value={product.packaging} /><Detail label="Penyimpanan" value={product.storageInstructions} /><Detail label="Masa simpan" value={product.shelfLifeDays ? `${product.shelfLifeDays} hari` : null} /></Section>
      <Section title="Harga dan Kapasitas"><Detail label="Harga" value={price(product.minimumPrice, product.maximumPrice, product.isPriceVisible)} /><Detail label="Negosiasi" value={product.isPriceNegotiable ? "Dapat dinegosiasikan" : "Harga tetap"} /><Detail label="Stok" value={product.stockQuantity ? `${product.stockQuantity} ${product.unitSymbol}` : null} /><Detail label="Minimum pesanan" value={product.minimumOrderQuantity ? `${product.minimumOrderQuantity} ${product.unitSymbol}` : null} /><Detail label="Kapasitas produksi" value={product.productionCapacity ? `${product.productionCapacity} ${product.unitSymbol}/${product.productionCapacityPeriod ? period[product.productionCapacityPeriod] : "periode"}` : null} /><Detail label="Ketersediaan" value={availability[product.availability]} /><Detail label="Cakupan pasar" value={product.marketScope} /></Section>
    </div><aside className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-[#087E8B]"><Building2 size={22} /></span><h2 className="mt-4 text-lg font-bold text-[#073B4C]">{product.businessName}</h2><p className="mt-1 text-xs font-bold text-[#087E8B]">{product.businessCode}</p><div className="mt-4 space-y-3 text-sm text-slate-600"><p>{product.businessAddress || "Alamat belum tersedia"}</p><p>{product.businessPhone || "Nomor telepon belum tersedia"}</p></div><Link href={`/dashboard/pelaku-usaha/${product.businessId}`} className="mt-5 inline-flex text-xs font-bold text-[#087E8B]">Lihat profil pelaku usaha</Link></section>
      {product.status === ProductStatus.PENDING_VERIFICATION ? <ProductVerificationDecision productId={product.id} /> : <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><PackageCheck className="h-8 w-8 text-[#087E8B]" /><h2 className="mt-3 font-bold text-[#073B4C]">Produk sudah diproses</h2><p className="mt-2 text-sm text-slate-600">Keputusan oleh {product.verifierName || "petugas"} pada {product.verifiedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(product.verifiedAt)) : "—"}.</p>{product.verificationNotes && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{product.verificationNotes}</p>}</section>}
    </aside></div>
  </div>;
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-[#073B4C]">{title}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div></section>; }
function Detail({ label, value, wide }: { readonly label: string; readonly value: string | null; readonly wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{value || "Belum diisi"}</p></div>; }
function statusLabel(status: ProductStatus) { return ({ DRAFT: "Draf", PENDING_VERIFICATION: "Menunggu verifikasi", REVISION_REQUIRED: "Perlu perbaikan", VERIFIED: "Terverifikasi", REJECTED: "Ditolak", INACTIVE: "Nonaktif" } as const)[status]; }
function price(minimum: string | null, maximum: string | null, visible: boolean) { if (!visible) return "Harga tidak ditampilkan"; const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); if (minimum && maximum) return `${formatter.format(Number(minimum))}–${formatter.format(Number(maximum))}`; return minimum || maximum ? formatter.format(Number(minimum || maximum)) : null; }

