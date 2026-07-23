"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";

import type { DashboardUserSummary } from "./dashboard-user-menu";
import { DashboardUserMenu } from "./dashboard-user-menu";

interface DashboardHeaderProps {
  readonly pageTitle: string;
  readonly user: DashboardUserSummary;
  readonly onOpenNavigation: () => void;
}

export function DashboardHeader({ pageTitle, user, onOpenNavigation }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button type="button" onClick={onOpenNavigation} aria-label="Buka navigasi" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-navy transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-ocean lg:hidden"><Menu className="h-5 w-5" /></button>
      <div className="min-w-0 lg:w-48"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-ocean">Ruang Kerja</p><p className="truncate text-sm font-bold text-navy">{pageTitle}</p></div>
      <div className="mx-auto hidden max-w-md flex-1 md:block">
        <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-muted" aria-label="Pencarian belum tersedia"><Search className="h-4 w-4" /><span>Cari layanan atau informasi...</span><span className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px]">Segera</span></div>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link href="/dashboard/notifications" aria-label="Buka notifikasi" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-slate-100 hover:text-navy focus-visible:outline-2 focus-visible:outline-ocean"><Bell className="h-5 w-5" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-gold" /></Link>
        <DashboardUserMenu user={user} />
      </div>
    </header>
  );
}
