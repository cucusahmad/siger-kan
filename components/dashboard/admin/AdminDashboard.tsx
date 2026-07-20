"use client";

import { Building2, CheckCircle2, Clock3, Eye, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminDashboardData } from "@/features/admin-dinas/admin-dinas.types";

interface AdminDashboardProps {
  readonly adminName: string;
  readonly data: AdminDashboardData;
}

const statusLabels: Readonly<Record<string, string>> = {
  ACTIVE: "Aktif", DRAFT: "Draf", PENDING_VERIFICATION: "Menunggu verifikasi",
  SUSPENDED: "Ditangguhkan", REJECTED: "Ditolak", INACTIVE: "Tidak aktif",
};
const typeLabels: Readonly<Record<string, string>> = {
  FISH_FARMER: "Pembudidaya", FISHER: "Nelayan", PROCESSOR: "Pengolah",
  DISTRIBUTOR: "Distributor", EXPORTER: "Eksportir", MSME: "UMKM", OTHER: "Lainnya",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function AdminDashboard({ adminName, data }: AdminDashboardProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const filteredBusinesses = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    return data.businesses.filter((business) => {
      const matchesQuery = !keyword || [business.name, business.code, business.ownerName, business.ownerEmail, business.location]
        .some((value) => value.toLocaleLowerCase("id-ID").includes(keyword));
      return matchesQuery && (status === "ALL" || business.status === status);
    });
  }, [data.businesses, query, status]);

  const cards = [
    { label: "Total Pelaku Usaha", value: data.statistics.totalBusinesses, icon: Building2, tone: "bg-seafoam text-ocean" },
    { label: "Usaha Aktif", value: data.statistics.activeBusinesses, icon: CheckCircle2, tone: "bg-[#EAF7F0] text-[#2E9F6B]" },
    { label: "Menunggu Verifikasi", value: data.statistics.pendingBusinesses, icon: Clock3, tone: "bg-[#FFF7E2] text-[#9A6A00]" },
    { label: "Akun Pengguna", value: data.statistics.totalBusinessUsers, icon: UsersRound, tone: "bg-[#F0F2FF] text-[#5967A9]" },
  ] as const;

  return (
    <div>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-ocean">Dashboard Admin Dinas</p><h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Selamat datang, {adminName}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Pantau data pengguna dan kelengkapan informasi pelaku usaha perikanan dalam satu ruang kerja.</p></div>
        <span className="w-fit rounded-full bg-seafoam px-4 py-2 text-xs font-bold text-ocean">Data terintegrasi SIGER-KAN</span>
      </header>

      <section aria-label="Statistik pelaku usaha" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <article key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(7,59,76,.05)]"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span><p className="mt-5 text-3xl font-bold text-navy">{card.value.toLocaleString("id-ID")}</p><p className="mt-1 text-sm font-semibold text-muted">{card.label}</p></article>)}
      </section>

      <section aria-labelledby="business-list-title" className="mt-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(7,59,76,.05)]">
        <div className="border-b border-slate-100 p-5 sm:p-6"><h2 id="business-list-title" className="text-lg font-bold text-navy">Data Pengguna Pelaku Usaha</h2><p className="mt-1 text-sm text-muted">Cari pengguna dan buka detail profil, legalitas, serta komoditas usahanya.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Cari pelaku usaha</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama usaha, pemilik, email, atau lokasi..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-navy outline-none transition focus:border-ocean focus:bg-white focus:ring-2 focus:ring-ocean/10" /></label><label><span className="sr-only">Filter status usaha</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-navy outline-none focus:border-ocean sm:w-56"><option value="ALL">Semua status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-muted"><tr><th className="px-6 py-4">Pelaku usaha</th><th className="px-4 py-4">Pemilik / pengguna</th><th className="px-4 py-4">Jenis & lokasi</th><th className="px-4 py-4">Kelengkapan</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredBusinesses.map((business) => <tr key={business.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-bold text-navy">{business.name}</p><p className="mt-1 text-xs text-muted">{business.code} · Terdaftar {formatDate(business.createdAt)}</p></td><td className="px-4 py-4"><p className="font-semibold text-ink">{business.ownerName}</p><p className="mt-1 text-xs text-muted">{business.ownerEmail}</p></td><td className="px-4 py-4"><p className="font-semibold text-ink">{typeLabels[business.businessType] ?? business.businessType}</p><p className="mt-1 text-xs text-muted">{business.location}</p></td><td className="px-4 py-4"><p className="text-xs font-semibold text-ink">{business.documentCount} dokumen</p><p className="mt-1 text-xs text-muted">{business.commodityCount} komoditas</p></td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${business.status === "ACTIVE" ? "bg-[#EAF7F0] text-[#247D55]" : business.status === "PENDING_VERIFICATION" ? "bg-[#FFF7E2] text-[#8A6411]" : "bg-slate-100 text-slate-600"}`}>{statusLabels[business.status] ?? business.status}</span></td><td className="px-6 py-4 text-right"><Link href={`/dashboard/pelaku-usaha/${business.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ocean/20 px-3.5 text-xs font-bold text-ocean transition hover:bg-seafoam focus-visible:outline-2 focus-visible:outline-ocean"><Eye className="h-4 w-4" />Lihat detail</Link></td></tr>)}</tbody></table></div>
        {filteredBusinesses.length === 0 && <div className="px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-bold text-navy">Data tidak ditemukan</p><p className="mt-1 text-sm text-muted">Coba ubah kata pencarian atau filter status.</p></div>}
        <div className="border-t border-slate-100 px-6 py-4 text-xs text-muted">Menampilkan {filteredBusinesses.length} dari {data.businesses.length} pelaku usaha</div>
      </section>
    </div>
  );
}
