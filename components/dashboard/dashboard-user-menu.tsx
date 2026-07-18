"use client";

import { ChevronDown, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "./logout-button";

export interface DashboardUserSummary {
  readonly fullName: string;
  readonly primaryRole: string;
  readonly businessName: string | null;
  readonly initials: string;
}

interface DashboardUserMenuProps {
  readonly user: DashboardUserSummary;
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-haspopup="menu" className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-ocean sm:gap-3 sm:px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-xs font-bold text-white">{user.initials}</span>
        <span className="hidden max-w-40 sm:block"><strong className="block truncate text-sm text-navy">{user.fullName}</strong><small className="block truncate text-[11px] text-muted">{user.businessName ?? user.primaryRole}</small></span>
        <ChevronDown className={`hidden h-4 w-4 text-muted transition-transform sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 top-[calc(100%+.6rem)] z-40 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(7,59,76,.16)]">
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="truncate text-sm font-bold text-navy">{user.fullName}</p>
            <p className="mt-1 truncate text-xs text-muted">{user.primaryRole}{user.businessName ? ` · ${user.businessName}` : ""}</p>
          </div>
          <div className="py-2">
            <Link role="menuitem" href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-ocean"><UserRound className="h-4 w-4 text-ocean" /> Profil Saya</Link>
            <Link role="menuitem" href="/dashboard/settings" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-ocean"><Settings className="h-4 w-4 text-ocean" /> Pengaturan Akun</Link>
          </div>
          <div className="border-t border-slate-100 pt-2"><LogoutButton variant="menu" /></div>
        </div>
      )}
    </div>
  );
}
