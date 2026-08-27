"use client";

import { ArrowLeft, FileSpreadsheet, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ExecutiveCertificationRow } from "@/features/executive-dashboard/certification-summary.types";

import { formatExecutiveDate, humanizeStatus, statusClass } from "./ExecutiveSummaryUi";

export function CertificationDetailReport({ generatedAt, rows }: { readonly generatedAt: string; readonly rows: readonly ExecutiveCertificationRow[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const keyword = query.trim().toLocaleLowerCase("id-ID");
  const statuses = [...new Set(rows.map((item) => item.status))];
  const filteredRows = useMemo(() => rows.filter((item) => {
    if (source !== "ALL" && item.source !== source) return false;
    if (status !== "ALL" && item.status !== status) return false;
    return !keyword || [item.referenceNumber, item.businessName, item.productName, item.certificationType, item.status]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(keyword));
  }), [keyword, rows, source, status]);

  return <div className="space-y-6">
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/dashboard/certification-summary" className="inline-flex items-center gap-2 text-xs font-bold text-ocean"><ArrowLeft className="h-4 w-4" />Kembali ke ringkasan</Link><p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-ocean">Laporan Pimpinan</p><h1 className="mt-2 text-3xl font-bold text-navy">Laporan Lengkap Sertifikasi</h1><p className="mt-2 text-sm leading-6 text-muted">Telusuri permohonan SIGER-KAN dan sertifikasi lampau berdasarkan sumber, status, atau kata kunci.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-muted"><FileSpreadsheet className="h-4 w-4 text-ocean" />Data per {formatExecutiveDate(generatedAt)}</span></header>
    <section aria-label="Filter laporan" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_190px_220px]"><label className="relative block"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Cari data sertifikasi</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor, pelaku usaha, atau produk..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-ocean focus:bg-white" /></label><Select label="Filter sumber" value={source} onChange={setSource} options={[{ value: "ALL", label: "Semua sumber" }, { value: "SIGERKAN", label: "SIGER-KAN" }, { value: "LAMPAU", label: "Sertifikasi lampau" }]} /><Select label="Filter status" value={status} onChange={setStatus} options={[{ value: "ALL", label: "Semua status" }, ...statuses.map((item) => ({ value: item, label: humanizeStatus(item) }))]} /></section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted"><tr>{["Sumber", "Nomor Referensi", "Pelaku Usaha", "Produk", "Jenis", "Tanggal Pengajuan/Terbit", "Berlaku Sampai", "Status"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.map((item) => <tr key={item.id}><Cell value={item.source === "SIGERKAN" ? "SIGER-KAN" : "Lampau"} /><Cell value={item.referenceNumber} strong /><Cell value={item.businessName} /><Cell value={item.productName} /><Cell value={humanizeStatus(item.certificationType)} /><Cell value={item.submittedOrIssuedAt ? formatExecutiveDate(item.submittedOrIssuedAt) : "-"} /><Cell value={item.expiresAt ? formatExecutiveDate(item.expiresAt) : "-"} /><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item.status)}`}>{humanizeStatus(item.status)}</span></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-6 py-4 text-xs text-muted">Menampilkan {filteredRows.length.toLocaleString("id-ID")} dari {rows.length.toLocaleString("id-ID")} data</div></section>
  </div>;
}

function Select({ label, value, onChange, options }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly options: readonly { readonly value: string; readonly label: string }[] }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-ink outline-none focus:border-ocean">{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}

function Cell({ value, strong = false }: { readonly value: string; readonly strong?: boolean }) {
  return <td className={`px-5 py-4 ${strong ? "font-bold text-navy" : "text-ink"}`}>{value}</td>;
}
