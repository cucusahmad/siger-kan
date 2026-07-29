"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CheckCircle2, ChevronRight, ImageIcon, PackageSearch, Search, Send, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type { CatalogProductView, ProductCatalogData } from "@/features/product-catalog/product-catalog.types";
import { productOfferInputSchema, type ProductOfferInput } from "@/features/product-offers/product-offer.schema";

interface Props {
  readonly initialData: ProductCatalogData;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly errors?: Record<string, readonly string[]>;
}

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";

export function ProductCatalogPage({ initialData }: Props) {
  const [query, setQuery] = useState("");
  const [commodity, setCommodity] = useState("");
  const [category, setCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProductView | null>(null);
  const [offerProduct, setOfferProduct] = useState<CatalogProductView | null>(null);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly message: string } | null>(null);
  const [submittedProductIds, setSubmittedProductIds] = useState<readonly string[]>([]);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ProductOfferInput>({
    resolver: zodResolver(productOfferInputSchema),
    defaultValues: { productId: "", quantity: "", unitPrice: "", deliveryAddress: "", validUntil: "", message: "" },
  });

  const products = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return initialData.products.filter((product) => {
      const matchesQuery = !needle || [product.name, product.brandName, product.businessName, product.commodityName, product.categoryName]
        .some((value) => value.toLocaleLowerCase("id").includes(needle));
      return matchesQuery
        && (!commodity || product.commodityId === commodity)
        && (!category || product.categoryId === category);
    });
  }, [category, commodity, initialData.products, query]);

  const openOffer = (product: CatalogProductView) => {
    setSelectedProduct(null);
    setFeedback(null);
    setOfferProduct(product);
    reset({
      productId: product.id,
      quantity: product.minimumOrderQuantity || "",
      unitPrice: product.minimumPrice || "",
      deliveryAddress: "",
      validUntil: "",
      message: "",
    });
  };

  const submitOffer = async (input: ProductOfferInput) => {
    const response = await fetch("/api/product-offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json() as ApiResponse;
    if (!result.success) {
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        if (field in input && messages[0]) setError(field as keyof ProductOfferInput, { message: messages[0] });
      });
      setFeedback({ kind: "error", message: result.message });
      return;
    }
    setSubmittedProductIds((current) => [...current, input.productId]);
    setOfferProduct(null);
    setFeedback({ kind: "success", message: result.message });
  };

  const hasOffer = (product: CatalogProductView) => product.hasSubmittedOffer || submittedProductIds.includes(product.id);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Business Matching · Katalog Produk</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Temukan Produk Perikanan Terverifikasi</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Jelajahi produk dari seluruh pelaku usaha, bandingkan informasi, lalu kirim penawaran langsung kepada pemilik produk.</p></div>
        <Link href="/dashboard/offers" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#073B4C]"><Send size={17} /> Lihat Penawaran <ChevronRight size={16} /></Link>
      </div>
      <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-white/75"><span className="rounded-full bg-white/10 px-4 py-2">{initialData.products.length} produk dari seluruh pelaku usaha</span><span className="rounded-full bg-white/10 px-4 py-2">Semua status produk</span><span className="rounded-full bg-white/10 px-4 py-2">Lintas pelaku usaha</span></div>
    </section>

    {feedback && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 size={18} />{feedback.message}</div>}

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-[#073B4C]"><SlidersHorizontal size={18} /> Cari dan Filter Produk</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_230px_230px]">
        <label className="relative"><span className="sr-only">Cari produk</span><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, usaha, merek, atau komoditas..." className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#0FA3B1]" /></label>
        <select value={commodity} onChange={(event) => setCommodity(event.target.value)} aria-label="Filter komoditas" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-600"><option value="">Semua komoditas</option>{initialData.commodities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter kategori" className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-600"><option value="">Semua kategori</option>{initialData.categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      </div>
    </section>

    {products.length === 0 ? <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><PackageSearch className="h-10 w-10 text-slate-300" /><h2 className="mt-4 font-bold text-[#073B4C]">Produk tidak ditemukan</h2><p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci atau filter katalog.</p></section> : <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} hasOffer={hasOffer(product)} onDetail={setSelectedProduct} onOffer={openOffer} canOffer={initialData.canOffer} />)}</section>}

    {selectedProduct && <ProductDetail product={selectedProduct} hasOffer={hasOffer(selectedProduct)} canOffer={initialData.canOffer} onClose={() => setSelectedProduct(null)} onOffer={openOffer} />}
    {offerProduct && <OfferDialog product={offerProduct} register={register} errors={errors} submitting={isSubmitting} onClose={() => setOfferProduct(null)} onSubmit={handleSubmit(submitOffer)} />}
  </div>;
}

function ProductCard({ product, hasOffer, canOffer, onDetail, onOffer }: { readonly product: CatalogProductView; readonly hasOffer: boolean; readonly canOffer: boolean; readonly onDetail: (product: CatalogProductView) => void; readonly onOffer: (product: CatalogProductView) => void }) {
  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative aspect-[16/10] bg-slate-100">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-slate-300" /></div>}<div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-[#087E8B] shadow-sm">{product.availability === "READY_STOCK" ? "Stok tersedia" : "Sesuai pesanan"}</span><span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-[#073B4C] shadow-sm">{productStatus(product)}</span></div></div>
    <div className="p-5"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Building2 size={14} />{product.businessName}</p><h2 className="mt-2 line-clamp-2 text-lg font-bold text-[#073B4C]">{product.name}</h2><p className="mt-1 text-xs font-semibold text-[#087E8B]">{product.commodityName} · {product.categoryName}</p><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{product.shortDescription || product.description || "Informasi produk tersedia pada detail katalog."}</p><div className="mt-4 border-t border-slate-100 pt-4"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Harga</span><strong className="mt-1 block text-base text-[#073B4C]">{price(product)}</strong></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => onDetail(product)} className="min-h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600">Lihat Detail</button>{!product.isOwnProduct && canOffer && product.canReceiveOffer && <button type="button" disabled={hasOffer} onClick={() => onOffer(product)} className="min-h-10 flex-1 rounded-xl bg-[#087E8B] px-3 text-sm font-bold text-white disabled:bg-slate-300">{hasOffer ? "Sudah Ditawar" : "Ajukan Penawaran"}</button>}</div></div>
  </article>;
}

function ProductDetail({ product, hasOffer, canOffer, onClose, onOffer }: { readonly product: CatalogProductView; readonly hasOffer: boolean; readonly canOffer: boolean; readonly onClose: () => void; readonly onOffer: (product: CatalogProductView) => void }) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold text-[#087E8B]">{product.businessName}</p><h2 className="mt-1 text-xl font-bold text-[#073B4C]">{product.name}</h2></div><button onClick={onClose} aria-label="Tutup detail" className="rounded-lg p-2 text-slate-400"><X /></button></div><div className="grid gap-6 p-5 sm:p-7 md:grid-cols-2"><div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="400px" unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-12 w-12 text-slate-300" /></div>}</div><div className="space-y-4"><Info label="Status produk" value={productStatus(product)} /><Info label="Komoditas" value={product.commodityName} /><Info label="Kategori" value={product.categoryName} /><Info label="Kemasan" value={product.packaging || "Tidak dicantumkan"} /><Info label="Minimum pemesanan" value={product.minimumOrderQuantity ? `${formatNumber(product.minimumOrderQuantity)} ${product.unitSymbol}` : "Tidak dibatasi"} /><Info label="Harga" value={price(product)} /><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Deskripsi</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{product.description || product.shortDescription || "Tidak dicantumkan"}</p></div>{!product.isOwnProduct && canOffer && product.canReceiveOffer && <button type="button" disabled={hasOffer} onClick={() => onOffer(product)} className="min-h-11 w-full rounded-xl bg-[#087E8B] px-4 text-sm font-bold text-white disabled:bg-slate-300">{hasOffer ? "Penawaran Sudah Diajukan" : "Ajukan Penawaran"}</button>}</div></div></div></div>;
}

function OfferDialog({ product, register, errors, submitting, onClose, onSubmit }: { readonly product: CatalogProductView; readonly register: ReturnType<typeof useForm<ProductOfferInput>>["register"]; readonly errors: ReturnType<typeof useForm<ProductOfferInput>>["formState"]["errors"]; readonly submitting: boolean; readonly onClose: () => void; readonly onSubmit: React.FormEventHandler<HTMLFormElement> }) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-7"><div><p className="text-xs font-bold text-[#087E8B]">Penawaran kepada {product.businessName}</p><h2 className="mt-1 text-xl font-bold text-[#073B4C]">{product.name}</h2></div><button type="button" onClick={onClose} aria-label="Tutup formulir" className="rounded-lg p-2 text-slate-400"><X /></button></div><form onSubmit={onSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"><input type="hidden" {...register("productId")} /><Field label={`Jumlah (${product.unitSymbol}) *`} error={errors.quantity?.message}><input {...register("quantity")} inputMode="decimal" className={inputClass} /></Field><Field label={`Harga per ${product.unitSymbol} *`} error={errors.unitPrice?.message}><input {...register("unitPrice")} inputMode="decimal" placeholder="Rupiah" className={inputClass} /></Field><Field label="Berlaku sampai *" error={errors.validUntil?.message}><input {...register("validUntil")} type="date" className={inputClass} /></Field><Field label="Alamat pengiriman *" error={errors.deliveryAddress?.message} wide><textarea {...register("deliveryAddress")} rows={3} className={`${inputClass} py-3`} /></Field><Field label="Pesan penawaran *" error={errors.message?.message} wide><textarea {...register("message")} rows={4} placeholder="Sampaikan kebutuhan, waktu pengiriman, dan ketentuan penawaran." className={`${inputClass} py-3`} /></Field><div className="flex justify-end gap-2 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Batal</button><button disabled={submitting} className="min-h-11 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Mengirim..." : "Kirim Penawaran"}</button></div></form></div></div>;
}

function Field({ label, error, wide, children }: { readonly label: string; readonly error?: string; readonly wide?: boolean; readonly children: React.ReactNode }) { return <label className={`text-sm font-bold text-[#073B4C] ${wide ? "sm:col-span-2" : ""}`}>{label}{children}{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>; }
function Info({ label, value }: { readonly label: string; readonly value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-[#073B4C]">{value}</p></div>; }
function formatNumber(value: string) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value)); }
function productStatus(product: CatalogProductView) { if (product.status === "VERIFIED") return product.isPublished ? "Terverifikasi & aktif" : "Terverifikasi"; const labels: Record<string, string> = { DRAFT: "Draf", PENDING_VERIFICATION: "Menunggu verifikasi", REVISION_REQUIRED: "Perlu revisi", REJECTED: "Ditolak" }; return labels[product.status] ?? product.status; }
function price(product: CatalogProductView) { if (!product.isPriceVisible) return "Hubungi penjual"; const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); const range = product.minimumPrice && product.maximumPrice ? `${formatter.format(Number(product.minimumPrice))}–${formatter.format(Number(product.maximumPrice))}` : product.minimumPrice || product.maximumPrice ? formatter.format(Number(product.minimumPrice || product.maximumPrice)) : "Hubungi penjual"; return product.isPriceNegotiable ? `${range} · Nego` : range; }
