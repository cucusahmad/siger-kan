import { ApplicationStatusBadge } from "@/components/dashboard/testing-applications/ApplicationStatusBadge";
import { ReceptionReviewForm } from "@/components/dashboard/testing-applications/ReceptionReviewForm";
import { requireSampleReceptionOfficer } from "@/features/testing-applications/testing-application.auth";
import { getReceptionApplication } from "@/features/testing-applications/testing-application.service";
import { ArrowLeft, Building2, FileText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props { readonly params: Promise<{ readonly id: string }> }
interface NamedRegion { readonly name: string }
interface Detail {
  readonly id: string; readonly applicationNumber: string | null; readonly status: string;
  readonly purpose: string | null; readonly otherPurpose: string | null; readonly testingTypes: readonly string[];
  readonly notes: string | null; readonly submittedAt: string | null; readonly correctionNotes: string | null;
  readonly businessProfile: { readonly businessType: string; readonly tradeName: string | null; readonly nib: string | null; readonly picName: string | null; readonly picPosition: string | null; readonly email: string | null; readonly phone: string | null; readonly whatsapp: string | null; readonly addressLine: string | null; readonly postalCode: string | null; readonly business: { readonly name: string; readonly businessCode: string }; readonly province: NamedRegion; readonly regency: NamedRegion; readonly district: NamedRegion | null; readonly village: NamedRegion | null };
  readonly laboratory: { readonly code: string; readonly name: string; readonly address: string | null } | null;
  readonly product: { readonly productName: string | null; readonly productType: string | null; readonly hsCode: string | null; readonly productForm: string | null; readonly otherProductForm: string | null; readonly description: string | null } | null;
  readonly samples: readonly { readonly id: string; readonly sampleName: string | null; readonly quantity: number | null; readonly weight: string | null; readonly weightUnit: string | null; readonly packaging: string | null; readonly condition: string | null; readonly samplingDate: string | null; readonly samplingLocation: string | null; readonly temperature: string | null; readonly description: string | null }[];
  readonly parameters: readonly { readonly id: string; readonly parameter: { readonly code: string; readonly name: string; readonly method: string | null; readonly category: { readonly name: string } }; readonly sample: { readonly sampleName: string | null } }[];
  readonly documents: readonly { readonly id: string; readonly fileName: string; readonly documentName: string | null; readonly documentType: string; readonly fileSize: string }[];
}

export default async function ReceptionDetailPage({ params }: Props) {
  try { await requireSampleReceptionOfficer(); } catch (error) { if (error instanceof Error && error.message === "UNAUTHENTICATED") redirect("/login"); redirect("/dashboard"); }
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let item: Detail;
  try { item = await getReceptionApplication(id) as Detail; } catch { notFound(); }
  const profile = item.businessProfile;
  const address = [profile.addressLine, profile.village?.name, profile.district?.name, profile.regency.name, profile.province.name, profile.postalCode].filter(Boolean).join(", ");
  const purpose = item.purpose === "LAINNYA" ? item.otherPurpose : formatEnum(item.purpose);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><Link href="/dashboard/quality-testing/sample-reception" className="inline-flex items-center gap-2 text-sm font-semibold text-[#087E8B]"><ArrowLeft size={16}/> Kembali ke antrean</Link><p className="mt-4 text-sm font-bold text-[#087E8B]">{item.applicationNumber}</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Detail Permohonan Pengujian</h1><p className="mt-2 text-sm text-slate-500">Seluruh data yang diisi dan diajukan oleh pelaku usaha.</p></div>
      <ApplicationStatusBadge status={item.status}/>
    </header>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <main className="space-y-5">
        <Section title="Data Pelaku Usaha" icon={<Building2 size={19}/>}><Info label="Nama usaha" value={profile.business.name}/><Info label="Kode usaha" value={profile.business.businessCode}/><Info label="Nama dagang" value={profile.tradeName}/><Info label="Jenis usaha" value={formatEnum(profile.businessType)}/><Info label="NIB" value={profile.nib}/><Info label="Penanggung jawab" value={[profile.picName, profile.picPosition].filter(Boolean).join(" — ")}/><Info label="Email" value={profile.email}/><Info label="Telepon / WhatsApp" value={[profile.phone, profile.whatsapp].filter(Boolean).join(" / ")}/><Info label="Alamat" value={address}/></Section>
        <Section title="Informasi Pengujian"><Info label="Tujuan pengujian" value={purpose}/><Info label="Jenis pengujian" value={item.testingTypes.join(", ")}/><Info label="Laboratorium" value={item.laboratory ? `${item.laboratory.name} (${item.laboratory.code})` : null}/><Info label="Alamat laboratorium" value={item.laboratory?.address}/><Info label="Tanggal pengajuan" value={formatDate(item.submittedAt)}/></Section>
        <Section title="Data Produk"><Info label="Nama produk" value={item.product?.productName}/><Info label="Jenis produk" value={item.product?.productType}/><Info label="Kode HS" value={item.product?.hsCode}/><Info label="Bentuk produk" value={item.product?.productForm === "LAINNYA" ? item.product.otherProductForm : formatEnum(item.product?.productForm)}/><Info label="Deskripsi" value={item.product?.description}/></Section>
        <Section title={`Data Sampel (${item.samples.length})`}>{item.samples.map((sample, index) => <article key={sample.id} className="border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0"><h3 className="font-bold text-slate-800">{index + 1}. {sample.sampleName || "Sampel tanpa nama"}</h3><dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2"><CompactInfo label="Jumlah" value={sample.quantity ? `${sample.quantity} sampel` : null}/><CompactInfo label="Berat" value={[sample.weight, sample.weightUnit].filter(Boolean).join(" ")}/><CompactInfo label="Kemasan" value={sample.packaging}/><CompactInfo label="Kondisi" value={formatEnum(sample.condition)}/><CompactInfo label="Tanggal sampling" value={formatDate(sample.samplingDate)}/><CompactInfo label="Lokasi sampling" value={sample.samplingLocation}/><CompactInfo label="Suhu" value={sample.temperature ? `${sample.temperature} °C` : null}/><CompactInfo label="Keterangan" value={sample.description}/></dl></article>)}</Section>
        <Section title={`Parameter Pengujian (${item.parameters.length})`}>{item.parameters.map((mapping) => <article key={mapping.id} className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"><p className="text-sm font-bold text-slate-800">{mapping.parameter.name}</p><p className="mt-1 text-xs text-slate-500">{mapping.parameter.category.name} · {mapping.parameter.code} · Sampel: {mapping.sample.sampleName || "-"}{mapping.parameter.method ? ` · Metode: ${mapping.parameter.method}` : ""}</p></article>)}</Section>
        <Section title={`Dokumen Pendukung (${item.documents.length})`} icon={<FileText size={19}/>}>{item.documents.length ? item.documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{document.documentName || document.fileName}</p><p className="mt-1 text-xs text-slate-500">{formatEnum(document.documentType)} · {formatFileSize(document.fileSize)}</p></div></div>) : <p className="text-sm text-slate-500">Tidak ada dokumen pendukung.</p>}</Section>
        <Section title="Catatan Pelaku Usaha"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.notes || "Tidak ada catatan tambahan."}</p></Section>
      </main>
      <aside>{item.status === "DIAJUKAN" ? <ReceptionReviewForm applicationId={id}/> : <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#073B4C]">Keputusan Tersimpan</h2><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.correctionNotes || "Permohonan telah dinyatakan lengkap dan disetujui."}</p></section>}</aside>
    </div>
  </div>;
}

function Section({ title, icon, children }: { readonly title: string; readonly icon?: React.ReactNode; readonly children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-bold text-[#073B4C]">{icon}{title}</h2>{children}</section>; }
function Info({ label, value }: { readonly label: string; readonly value?: string | null }) { return <div className="grid gap-1 border-b border-slate-100 py-3 text-sm last:border-0 sm:grid-cols-[180px_1fr]"><span className="text-slate-500">{label}</span><strong className="whitespace-pre-wrap text-slate-700 sm:text-right">{value || "-"}</strong></div>; }
function CompactInfo({ label, value }: { readonly label: string; readonly value?: string | null }) { return <div><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-0.5 text-sm font-medium text-slate-700">{value || "-"}</dd></div>; }
function formatEnum(value?: string | null): string { return value ? value.replaceAll("_", " ").toLocaleLowerCase("id-ID").replace(/^./, (letter) => letter.toLocaleUpperCase("id-ID")) : "-"; }
function formatDate(value?: string | null): string { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value)) : "-"; }
function formatFileSize(value: string): string { const bytes = Number(value); if (!Number.isFinite(bytes)) return "-"; return bytes < 1_048_576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`; }
