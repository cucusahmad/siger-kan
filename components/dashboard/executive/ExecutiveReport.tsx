"use client";

import { BadgeCheck, Building2, FileSpreadsheet, FlaskConical, Handshake, PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { ExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.types";
import type { ExecutiveCertificationRow } from "@/features/executive-dashboard/certification-summary.types";

interface ExecutiveReportProps {
  readonly data: ExecutiveDashboardData;
  readonly certificationRows: readonly ExecutiveCertificationRow[];
  readonly initialSection: string;
}

const sections = [
  { id: "businesses", label: "Pelaku Usaha", icon: Building2 },
  { id: "products", label: "Produk", icon: PackageSearch },
  { id: "matching", label: "Business Matching", icon: Handshake },
  { id: "testing", label: "Pengujian Mutu", icon: FlaskConical },
  { id: "certification", label: "Sertifikasi", icon: BadgeCheck },
] as const;

export function ExecutiveReport({ data, certificationRows, initialSection }: ExecutiveReportProps) {
  const validSection = sections.some(({ id }) => id === initialSection) ? initialSection : "businesses";
  const [section, setSection] = useState(validSection);
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLocaleLowerCase("id-ID");
  const businesses = useMemo(() => data.businesses.filter((item) => !keyword || [item.name, item.code, item.type, item.region, item.status].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))), [data.businesses, keyword]);
  const products = useMemo(() => data.products.filter((item) => !keyword || [item.name, item.businessName, item.commodity, item.category, item.status].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))), [data.products, keyword]);
  const matches = useMemo(() => data.matches.filter((item) => !keyword || [item.subject, item.requester, item.partner, item.status].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))), [data.matches, keyword]);
  const testing = useMemo(() => data.testing.filter((item) => !keyword || [item.applicationNumber, item.businessName, item.productName, item.laboratoryName, item.status].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))), [data.testing, keyword]);
  const certifications = useMemo(() => certificationRows.filter((item) => !keyword || [item.source, item.referenceNumber, item.businessName, item.productName, item.certificationType, item.status].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))), [certificationRows, keyword]);

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-ocean">Pelaporan Terintegrasi</p><h1 className="mt-2 text-3xl font-bold text-navy">Laporan Eksekutif</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Data operasional pelaku usaha, produk, business matching, pengujian mutu, dan sertifikasi dalam satu laporan pimpinan.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-muted"><FileSpreadsheet className="h-4 w-4 text-ocean" />Data per {formatDate(data.generatedAt)}</span></header>
    <nav aria-label="Jenis laporan" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">{sections.map((item) => <button key={item.id} type="button" onClick={() => { setSection(item.id); setQuery(""); }} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${section === item.id ? "bg-navy text-white" : "text-muted hover:bg-slate-50 hover:text-navy"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</nav>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative block"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Cari data laporan</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, status, wilayah, komoditas, atau nomor pengajuan..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-ocean focus:bg-white" /></label></div>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        {section === "businesses" && <table className="w-full min-w-[1050px] text-left text-sm"><Head labels={["Kode", "Pelaku Usaha", "Jenis", "Wilayah", "Produk", "Kebutuhan", "Penawaran", "Status"]} /><tbody className="divide-y divide-slate-100">{businesses.map((item) => <tr key={item.id}><Cell value={item.code} strong /><Cell value={item.name} /><Cell value={humanize(item.type)} /><Cell value={item.region} /><Cell value={item.productCount} /><Cell value={item.needCount} /><Cell value={item.offerCount} /><Status value={item.status} /></tr>)}</tbody></table>}
        {section === "products" && <table className="w-full min-w-[1050px] text-left text-sm"><Head labels={["Produk", "Pelaku Usaha", "Komoditas", "Kategori", "Pasar", "Penawaran", "Publikasi", "Status"]} /><tbody className="divide-y divide-slate-100">{products.map((item) => <tr key={item.id}><Cell value={item.name} strong /><Cell value={item.businessName} /><Cell value={item.commodity} /><Cell value={item.category} /><Cell value={humanize(item.marketScope)} /><Cell value={item.offerCount} /><Cell value={item.published ? "Tayang" : "Tidak tayang"} /><Status value={item.status} /></tr>)}</tbody></table>}
        {section === "matching" && <table className="w-full min-w-[1100px] text-left text-sm"><Head labels={["Sumber", "Subjek", "Pemohon/Pembeli", "Mitra/Penjual", "Kuantitas", "Nilai Potensi", "Tanggal", "Status"]} /><tbody className="divide-y divide-slate-100">{matches.map((item) => <tr key={item.id}><Cell value={humanize(item.source)} /><Cell value={item.subject} strong /><Cell value={item.requester} /><Cell value={item.partner} /><Cell value={item.quantity} /><Cell value={formatCurrency(item.value)} /><Cell value={formatDate(item.submittedAt)} /><Status value={item.status} /></tr>)}</tbody></table>}
        {section === "testing" && <table className="w-full min-w-[1000px] text-left text-sm"><Head labels={["Nomor Pengajuan", "Pelaku Usaha", "Produk", "Laboratorium", "Tanggal Pengajuan", "Status"]} /><tbody className="divide-y divide-slate-100">{testing.map((item) => <tr key={item.id}><Cell value={item.applicationNumber} strong /><Cell value={item.businessName} /><Cell value={item.productName} /><Cell value={item.laboratoryName} /><Cell value={item.submittedAt ? formatDate(item.submittedAt) : "Belum diajukan"} /><Status value={item.status} /></tr>)}</tbody></table>}
        {section === "certification" && <table className="w-full min-w-[1150px] text-left text-sm"><Head labels={["Sumber", "Nomor Referensi", "Pelaku Usaha", "Produk", "Jenis", "Tanggal Pengajuan/Terbit", "Berlaku Sampai", "Status"]} /><tbody className="divide-y divide-slate-100">{certifications.map((item) => <tr key={item.id}><Cell value={item.source === "SIGERKAN" ? "SIGER-KAN" : "Lampau"} /><Cell value={item.referenceNumber} strong /><Cell value={item.businessName} /><Cell value={item.productName} /><Cell value={humanize(item.certificationType)} /><Cell value={item.submittedOrIssuedAt ? formatDate(item.submittedOrIssuedAt) : "-"} /><Cell value={item.expiresAt ? formatDate(item.expiresAt) : "-"} /><Status value={item.status} /></tr>)}</tbody></table>}
      </div>
      <div className="border-t border-slate-100 px-6 py-4 text-xs text-muted">Menampilkan {section === "businesses" ? businesses.length : section === "products" ? products.length : section === "matching" ? matches.length : section === "testing" ? testing.length : certifications.length} data</div>
    </section>
  </div>;
}

function Head({ labels }: { readonly labels: readonly string[] }) {
  return <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted"><tr>{labels.map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>;
}
function Cell({ value, strong = false }: { readonly value: string | number; readonly strong?: boolean }) {
  return <td className={`px-5 py-4 ${strong ? "font-bold text-navy" : "text-ink"}`}>{typeof value === "number" ? value.toLocaleString("id-ID") : value}</td>;
}
function Status({ value }: { readonly value: string }) {
  return <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${["ACTIVE", "VERIFIED", "ACCEPTED", "SELESAI"].includes(value) ? "bg-[#EAF7F0] text-[#247D55]" : ["REJECTED", "DITOLAK"].includes(value) ? "bg-[#FFF0F2] text-[#B64A55]" : "bg-[#FFF7E2] text-[#8A6411]"}`}>{humanize(value)}</span></td>;
}
function humanize(value: string): string { return value.replaceAll("_", " ").toLocaleLowerCase("id-ID").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("id-ID")); }
function formatDate(value: string): string { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatCurrency(value: string): string { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)); }
