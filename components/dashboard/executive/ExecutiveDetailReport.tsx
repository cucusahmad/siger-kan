"use client";

import { ArrowLeft, Eye, FileSpreadsheet, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ExecutiveMatchRow, ExecutiveTestingRow } from "@/features/executive-dashboard/executive-dashboard.types";

import { formatExecutiveDate, humanizeStatus, statusClass } from "./ExecutiveSummaryUi";

interface TestingReportProps {
  readonly kind: "testing";
  readonly generatedAt: string;
  readonly rows: readonly ExecutiveTestingRow[];
}

interface MatchingReportProps {
  readonly kind: "matching";
  readonly generatedAt: string;
  readonly rows: readonly ExecutiveMatchRow[];
}

export function ExecutiveDetailReport(props: TestingReportProps | MatchingReportProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const keyword = query.trim().toLocaleLowerCase("id-ID");
  const statuses = [...new Set(props.rows.map((item) => item.status))];
  const rows = useMemo(() => {
    if (props.kind === "testing") {
      return props.rows.filter((item) => {
        if (status !== "ALL" && item.status !== status) return false;
        const values = [item.applicationNumber, item.businessName, item.productName, item.laboratoryName, item.status];
        return !keyword || values.some((value) => value.toLocaleLowerCase("id-ID").includes(keyword));
      });
    }
    return props.rows.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      const values = [item.subject, item.requester, item.partner, item.source, item.status];
      return !keyword || values.some((value) => value.toLocaleLowerCase("id-ID").includes(keyword));
    });
  }, [keyword, props, status]);
  const isTesting = props.kind === "testing";
  const backHref = isTesting ? "/dashboard/testing-summary" : "/dashboard/business-match-summary";

  return <div className="space-y-6">
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-ocean"><ArrowLeft className="h-4 w-4" />Kembali ke ringkasan</Link><p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-ocean">Laporan Pimpinan</p><h1 className="mt-2 text-3xl font-bold text-navy">Laporan Lengkap {isTesting ? "Pengujian" : "Business Match"}</h1><p className="mt-2 text-sm leading-6 text-muted">Telusuri seluruh data, gunakan pencarian dan filter status untuk menemukan informasi yang dibutuhkan.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-muted"><FileSpreadsheet className="h-4 w-4 text-ocean" />Data per {formatExecutiveDate(props.generatedAt)}</span></header>
    <section aria-label="Filter laporan" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_240px]"><label className="relative block"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Cari data</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isTesting ? "Cari nomor, pelaku usaha, produk, atau laboratorium..." : "Cari subjek, pelaku usaha, mitra, atau sumber..."} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-ocean focus:bg-white" /></label><label><span className="sr-only">Filter status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-ink outline-none focus:border-ocean"><option value="ALL">Semua status</option>{statuses.map((item) => <option key={item} value={item}>{humanizeStatus(item)}</option>)}</select></label></section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto">{isTesting ? <TestingTable rows={rows as readonly ExecutiveTestingRow[]} /> : <MatchingTable rows={rows as readonly ExecutiveMatchRow[]} />}</div><div className="border-t border-slate-100 px-6 py-4 text-xs text-muted">Menampilkan {rows.length.toLocaleString("id-ID")} dari {props.rows.length.toLocaleString("id-ID")} data</div></section>
  </div>;
}

function TestingTable({ rows }: { readonly rows: readonly ExecutiveTestingRow[] }) {
  return <table className="w-full min-w-[1050px] text-left text-sm"><TableHead labels={["Nomor Pengajuan", "Pelaku Usaha", "Produk", "Laboratorium", "Tanggal", "Status", "Detail"]} /><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id}><Cell value={item.applicationNumber} strong /><Cell value={item.businessName} /><Cell value={item.productName} /><Cell value={item.laboratoryName} /><Cell value={item.submittedAt ? formatExecutiveDate(item.submittedAt) : "Belum diajukan"} /><StatusCell value={item.status} /><td className="px-5 py-4"><Link href={`/dashboard/reports/${item.id}`} aria-label={`Lihat detail ${item.applicationNumber}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-seafoam px-3 text-xs font-bold text-ocean hover:bg-ocean hover:text-white"><Eye className="h-3.5 w-3.5" />Lihat</Link></td></tr>)}</tbody></table>;
}

function MatchingTable({ rows }: { readonly rows: readonly ExecutiveMatchRow[] }) {
  return <table className="w-full min-w-[1150px] text-left text-sm"><TableHead labels={["Sumber", "Subjek", "Pemohon/Pembeli", "Mitra/Penjual", "Kuantitas", "Nilai Potensi", "Tanggal", "Status"]} /><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id}><Cell value={humanizeStatus(item.source)} /><Cell value={item.subject} strong /><Cell value={item.requester} /><Cell value={item.partner} /><Cell value={item.quantity} /><Cell value={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(item.value))} /><Cell value={formatExecutiveDate(item.submittedAt)} /><StatusCell value={item.status} /></tr>)}</tbody></table>;
}

function TableHead({ labels }: { readonly labels: readonly string[] }) {
  return <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted"><tr>{labels.map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>;
}
function Cell({ value, strong = false }: { readonly value: string; readonly strong?: boolean }) {
  return <td className={`px-5 py-4 ${strong ? "font-bold text-navy" : "text-ink"}`}>{value}</td>;
}
function StatusCell({ value }: { readonly value: string }) {
  return <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(value)}`}>{humanizeStatus(value)}</span></td>;
}
