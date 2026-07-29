"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ImagePlus, PackageOpen, Pencil, Plus, Search, Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { productInputSchema, type ProductInput } from "@/features/products/product.schema";
import type { ProductPageData, ProductView } from "@/features/products/product.types";

interface Props {
  readonly initialData: ProductPageData;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: ProductView | ProductPageData | null;
  readonly errors?: Record<string, readonly string[]>;
}

const defaults: ProductInput = {
  sku: "", name: "", brandName: "", commodityId: "", categoryId: "", unitId: "",
  shortDescription: "", description: "", packaging: "", storageInstructions: "", shelfLifeDays: "",
  minimumPrice: "", maximumPrice: "", isPriceNegotiable: false, isPriceVisible: true,
  stockQuantity: "", minimumOrderQuantity: "", productionCapacity: "", productionCapacityPeriod: "",
  availability: "READY_STOCK", marketScope: "LOCAL",
};

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#0FA3B1] focus:ring-2 focus:ring-[#0FA3B1]/10";
const statusLabels: Record<ProductView["status"], string> = {
  DRAFT: "Draf", PENDING_VERIFICATION: "Menunggu verifikasi", REVISION_REQUIRED: "Perlu perbaikan",
  VERIFIED: "Terverifikasi", REJECTED: "Ditolak", INACTIVE: "Nonaktif",
};
const availabilityLabels: Record<ProductInput["availability"], string> = {
  READY_STOCK: "Stok tersedia", PREORDER: "Pre-order", SEASONAL: "Musiman", OUT_OF_STOCK: "Stok habis",
};

function values(product?: ProductView): ProductInput {
  if (!product) return defaults;
  return {
    sku: product.sku, name: product.name, brandName: product.brandName,
    commodityId: product.commodityId, categoryId: product.categoryId, unitId: product.unitId,
    shortDescription: product.shortDescription, description: product.description, packaging: product.packaging,
    storageInstructions: product.storageInstructions, shelfLifeDays: product.shelfLifeDays,
    minimumPrice: product.minimumPrice, maximumPrice: product.maximumPrice,
    isPriceNegotiable: product.isPriceNegotiable, isPriceVisible: product.isPriceVisible,
    stockQuantity: product.stockQuantity, minimumOrderQuantity: product.minimumOrderQuantity,
    productionCapacity: product.productionCapacity, productionCapacityPeriod: product.productionCapacityPeriod,
    availability: product.availability, marketScope: product.marketScope,
  };
}

export function BusinessProductsPage({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProductView | null | undefined>(undefined);
  const [imageProduct, setImageProduct] = useState<ProductView | null>(null);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: defaults,
  });

  const products = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return needle ? data.products.filter((item) => [item.name, item.brandName, item.sku, item.commodityName, item.categoryName].some((value) => value.toLocaleLowerCase("id").includes(needle))) : data.products;
  }, [data.products, query]);

  const reload = async () => {
    const response = await fetch("/api/business/products");
    const result = await response.json() as ApiResponse;
    if (result.success && result.data && "products" in result.data) setData(result.data);
  };

  const openForm = (product?: ProductView) => {
    setFeedback(null);
    setEditing(product ?? null);
    reset(values(product));
  };

  const save = async (input: ProductInput) => {
    const response = await fetch(editing ? `/api/business/products/${editing.id}` : "/api/business/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json() as ApiResponse;
    if (!result.success) {
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        if (field in input && messages[0]) setError(field as keyof ProductInput, { message: messages[0] });
      });
      setFeedback({ kind: "error", message: result.message });
      return;
    }
    await reload();
    setEditing(undefined);
    setFeedback({ kind: "success", message: result.message });
  };

  const productAction = async (product: ProductView, action: "SUBMIT" | "ACTIVATE" | "DEACTIVATE" | "DELETE") => {
    setBusyId(product.id);
    const response = await fetch(`/api/business/products/${product.id}`, action === "DELETE"
      ? { method: "DELETE" }
      : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success) await reload();
  };

  const uploadImage = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !imageProduct) return;
    setBusyId(imageProduct.id);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("altText", imageProduct.name);
    const response = await fetch(`/api/business/products/${imageProduct.id}/images`, { method: "POST", body: formData });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success && result.data && "products" in result.data) {
      setData(result.data);
      setImageProduct(result.data.products.find((item) => item.id === imageProduct.id) ?? null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = async (product: ProductView, imageId: string) => {
    setBusyId(imageId);
    const response = await fetch(`/api/business/products/${product.id}/images/${imageId}`, { method: "DELETE" });
    const result = await response.json() as ApiResponse;
    setBusyId(null);
    setFeedback({ kind: result.success ? "success" : "error", message: result.message });
    if (result.success) {
      await reload();
      setImageProduct((current) => current ? { ...current, images: current.images.filter((image) => image.id !== imageId) } : null);
    }
  };

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Pelaku Usaha · Product Management</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Kelola Produk</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Kelola katalog produk {data.businessName}, informasi harga, kapasitas, ketersediaan, dan gambar produk.</p></div>
        {data.canEdit && <button type="button" onClick={() => openForm()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0FA3B1] px-5 text-sm font-bold text-white"><Plus size={18} /> Tambah Produk</button>}
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><Stat value={data.products.length} label="Total produk" /><Stat value={data.products.filter((item) => item.status === "VERIFIED").length} label="Terverifikasi" /><Stat value={data.products.filter((item) => item.isPublished).length} label="Dipublikasikan" /></div>
    </section>

    {feedback && <div role="status" className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><CheckCircle2 size={18} />{feedback.message}</div>}

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="relative block max-w-sm"><span className="sr-only">Cari produk</span><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, merek, atau SKU..." className={`${inputClass} mt-0 pl-10`} /></label>
    </section>

    {products.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex h-48 items-center justify-center bg-slate-100">
        {product.images[0] ? <Image src={product.images[0].url} alt={product.images[0].altText ?? product.name} fill unoptimized className="object-cover" /> : <PackageOpen className="h-12 w-12 text-slate-300" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#087E8B] shadow-sm">{statusLabels[product.status]}</span>
      </div>
      <div className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#087E8B]">{product.commodityName} · {product.categoryName}</p><h2 className="mt-2 text-lg font-bold text-[#073B4C]">{product.name}</h2><p className="mt-1 text-xs text-slate-500">{product.brandName || "Tanpa merek"} {product.sku ? `· SKU ${product.sku}` : ""}</p><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{product.shortDescription || product.description || "Belum ada narasi produk."}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Info label="Harga" value={price(product)} /><Info label="Ketersediaan" value={availabilityLabels[product.availability]} /></div>
        {product.verificationNotes && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{product.verificationNotes}</p>}
        {data.canEdit && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {["DRAFT", "REVISION_REQUIRED", "REJECTED"].includes(product.status) && <button onClick={() => openForm(product)} className="rounded-lg border border-slate-200 p-2 text-[#087E8B]" aria-label={`Edit ${product.name}`}><Pencil size={16} /></button>}
          <button onClick={() => setImageProduct(product)} className="rounded-lg border border-slate-200 p-2 text-[#087E8B]" aria-label={`Kelola gambar ${product.name}`}><ImagePlus size={16} /></button>
          {["DRAFT", "REVISION_REQUIRED", "REJECTED"].includes(product.status) && <button disabled={busyId === product.id} onClick={() => productAction(product, "SUBMIT")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white"><Send size={14} /> Ajukan</button>}
          {product.status === "VERIFIED" && <button disabled={busyId === product.id} onClick={() => productAction(product, product.isPublished ? "DEACTIVATE" : "ACTIVATE")} className="rounded-lg bg-[#087E8B] px-3 py-2 text-xs font-bold text-white">{product.isPublished ? "Nonaktifkan" : "Publikasikan"}</button>}
          <button disabled={busyId === product.id} onClick={() => { if (window.confirm(`Hapus produk ${product.name}?`)) void productAction(product, "DELETE"); }} className="ml-auto rounded-lg border border-red-100 p-2 text-[#E63946]" aria-label={`Hapus ${product.name}`}><Trash2 size={16} /></button>
        </div>}
      </div>
    </article>)}</div> : <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><PackageOpen className="h-12 w-12 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-[#073B4C]">Belum ada produk</h2><p className="mt-2 text-sm text-slate-500">Tambahkan produk pertama yang dimiliki atau diproduksi usaha Anda.</p></section>}

    {editing !== undefined && <ProductForm editing={editing} data={data} register={register} errors={errors} submitting={isSubmitting} onClose={() => setEditing(undefined)} onSubmit={handleSubmit(save)} />}

    {imageProduct && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#073B4C]">Galeri {imageProduct.name}</h2><p className="mt-1 text-xs text-slate-500">Maksimal 6 gambar, masing-masing 5 MB.</p></div><button onClick={() => setImageProduct(null)} className="rounded-lg p-2 text-slate-400"><X size={20} /></button></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{imageProduct.images.map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100"><Image src={image.url} alt={image.altText ?? imageProduct.name} fill unoptimized className="object-cover" /><button onClick={() => removeImage(imageProduct, image.id)} disabled={busyId === image.id} className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-red-600 shadow" aria-label="Hapus gambar"><Trash2 size={15} /></button>{image.isPrimary && <span className="absolute bottom-2 left-2 rounded-md bg-[#073B4C] px-2 py-1 text-[10px] font-bold text-white">Utama</span>}</div>)}</div><div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="min-w-0 flex-1 text-sm" /><button onClick={uploadImage} disabled={busyId === imageProduct.id || imageProduct.images.length >= 6} className="min-h-11 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white disabled:opacity-50">Unggah Gambar</button></div></div></div>}
  </div>;
}

function ProductForm({ editing, data, register, errors, submitting, onClose, onSubmit }: {
  readonly editing: ProductView | null; readonly data: ProductPageData;
  readonly register: ReturnType<typeof useForm<ProductInput>>["register"];
  readonly errors: ReturnType<typeof useForm<ProductInput>>["formState"]["errors"];
  readonly submitting: boolean; readonly onClose: () => void; readonly onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B4C]/55 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:px-7"><div><h2 className="text-lg font-bold text-[#073B4C]">{editing ? "Edit Produk" : "Tambah Produk"}</h2><p className="mt-1 text-xs text-slate-500">Lengkapi identitas, narasi, harga, dan kapasitas produk.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={20} /></button></div><form onSubmit={onSubmit} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
    <Field label="Nama produk *" error={errors.name?.message}><input {...register("name")} className={inputClass} /></Field>
    <Field label="Merek"><input {...register("brandName")} className={inputClass} /></Field>
    <Field label="SKU"><input {...register("sku")} className={inputClass} /></Field>
    <Select label="Komoditas *" name="commodityId" register={register} options={data.options.commodities} error={errors.commodityId?.message} />
    <Select label="Kategori *" name="categoryId" register={register} options={data.options.categories} error={errors.categoryId?.message} />
    <Select label="Satuan *" name="unitId" register={register} options={data.options.units} error={errors.unitId?.message} />
    <Field label="Narasi singkat" error={errors.shortDescription?.message} wide><textarea {...register("shortDescription")} rows={2} className={`${inputClass} py-3`} /></Field>
    <Field label="Deskripsi lengkap" error={errors.description?.message} wide><textarea {...register("description")} rows={5} className={`${inputClass} py-3`} /></Field>
    <Field label="Harga minimum" error={errors.minimumPrice?.message}><input {...register("minimumPrice")} inputMode="decimal" placeholder="Contoh: 25000" className={inputClass} /></Field>
    <Field label="Harga maksimum" error={errors.maximumPrice?.message}><input {...register("maximumPrice")} inputMode="decimal" placeholder="Contoh: 30000" className={inputClass} /></Field>
    <Field label="Stok"><input {...register("stockQuantity")} inputMode="decimal" className={inputClass} /></Field>
    <Field label="Minimum pesanan"><input {...register("minimumOrderQuantity")} inputMode="decimal" className={inputClass} /></Field>
    <Field label="Kapasitas produksi"><input {...register("productionCapacity")} inputMode="decimal" className={inputClass} /></Field>
    <Select label="Periode kapasitas" name="productionCapacityPeriod" register={register} options={[{ id: "", label: "Pilih periode" }, { id: "DAILY", label: "Harian" }, { id: "WEEKLY", label: "Mingguan" }, { id: "MONTHLY", label: "Bulanan" }, { id: "YEARLY", label: "Tahunan" }]} error={errors.productionCapacityPeriod?.message} />
    <Select label="Ketersediaan" name="availability" register={register} options={Object.entries(availabilityLabels).map(([id, label]) => ({ id, label }))} />
    <Select label="Cakupan pasar" name="marketScope" register={register} options={[{ id: "LOCAL", label: "Lokal" }, { id: "NATIONAL", label: "Nasional" }, { id: "EXPORT", label: "Ekspor" }]} />
    <Field label="Kemasan"><input {...register("packaging")} className={inputClass} /></Field>
    <Field label="Masa simpan (hari)" error={errors.shelfLifeDays?.message}><input {...register("shelfLifeDays")} inputMode="numeric" className={inputClass} /></Field>
    <Field label="Petunjuk penyimpanan" error={errors.storageInstructions?.message} wide><textarea {...register("storageInstructions")} rows={2} className={`${inputClass} py-3`} /></Field>
    <div className="flex flex-wrap gap-6 sm:col-span-2"><label className="flex items-center gap-2 text-sm font-semibold text-[#073B4C]"><input type="checkbox" {...register("isPriceVisible")} className="h-4 w-4 accent-[#087E8B]" /> Tampilkan harga</label><label className="flex items-center gap-2 text-sm font-semibold text-[#073B4C]"><input type="checkbox" {...register("isPriceNegotiable")} className="h-4 w-4 accent-[#087E8B]" /> Harga dapat dinegosiasikan</label></div>
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Batal</button><button disabled={submitting} className="min-h-11 rounded-xl bg-[#087E8B] px-5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan Produk"}</button></div>
  </form></div></div>;
}

function Field({ label, error, wide, children }: { readonly label: string; readonly error?: string; readonly wide?: boolean; readonly children: React.ReactNode }) { return <label className={`text-sm font-bold text-[#073B4C] ${wide ? "sm:col-span-2" : ""}`}>{label}{children}{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>; }
function Select({ label, name, register, options, error }: { readonly label: string; readonly name: "commodityId" | "categoryId" | "unitId" | "productionCapacityPeriod" | "availability" | "marketScope"; readonly register: ReturnType<typeof useForm<ProductInput>>["register"]; readonly options: readonly { readonly id: string; readonly label: string }[]; readonly error?: string }) { return <Field label={label} error={error}><select {...register(name)} className={inputClass}>{!options.some((item) => item.id === "") && <option value="">Pilih {label.toLocaleLowerCase("id")}</option>}{options.map((item) => <option key={item.id || "empty"} value={item.id}>{item.label}</option>)}</select></Field>; }
function Stat({ value, label }: { readonly value: number; readonly label: string }) { return <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{value}</strong><span className="text-xs text-white/70">{label}</span></div>; }
function Info({ label, value }: { readonly label: string; readonly value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span><strong className="mt-1 block text-xs text-[#073B4C]">{value}</strong></div>; }
function price(product: ProductView) { if (!product.isPriceVisible) return "Hubungi penjual"; const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); if (!product.minimumPrice && !product.maximumPrice) return "Belum diisi"; if (product.minimumPrice && product.maximumPrice) return `${formatter.format(Number(product.minimumPrice))}–${formatter.format(Number(product.maximumPrice))}`; return formatter.format(Number(product.minimumPrice || product.maximumPrice)); }

