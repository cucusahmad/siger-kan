"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { DashboardNavigationGroup } from "./dashboard-navigation";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardMobileNavProps {
  readonly isOpen: boolean;
  readonly navigation: readonly DashboardNavigationGroup[];
  readonly onClose: () => void;
}

export function DashboardMobileNav({ isOpen, navigation, onClose }: DashboardMobileNavProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi utama">
      <button type="button" className="absolute inset-0 bg-navy/55 backdrop-blur-sm" onClick={onClose} aria-label="Tutup navigasi" />
      <div className="relative h-full w-[min(86vw,320px)] shadow-2xl">
        <DashboardSidebar navigation={navigation} onNavigate={onClose} />
        <button type="button" onClick={onClose} aria-label="Tutup navigasi" className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-aqua">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
