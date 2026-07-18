"use client";

import {
  BadgeCheck,
  Beaker,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardCheck,
  FileBadge,
  FileChartColumn,
  Handshake,
  LayoutDashboard,
  MessageSquareHeart,
  PackageSearch,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  isDashboardRouteActive,
  type DashboardIconKey,
  type DashboardNavigationGroup,
} from "./dashboard-navigation";

const iconMap: Record<DashboardIconKey, LucideIcon> = {
  badgeCheck: BadgeCheck,
  beaker: Beaker,
  bookOpen: BookOpen,
  briefcaseBusiness: BriefcaseBusiness,
  building: Building2,
  chart: ChartNoAxesCombined,
  clipboardCheck: ClipboardCheck,
  dashboard: LayoutDashboard,
  fileBadge: FileBadge,
  fileChart: FileChartColumn,
  handshake: Handshake,
  messageSquareHeart: MessageSquareHeart,
  packageSearch: PackageSearch,
  settings: Settings,
  user: UserRound,
};

interface DashboardSidebarProps {
  readonly navigation: readonly DashboardNavigationGroup[];
  readonly onNavigate?: () => void;
}

export function DashboardSidebar({ navigation, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<readonly string[]>([]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((current) => current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label]);
  };

  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <Link href="/dashboard" onClick={onNavigate} className="flex min-h-20 items-center gap-3 border-b border-white/10 px-5 focus-visible:outline-2 focus-visible:outline-aqua">
        <span className="rounded-xl bg-white p-1.5"><Image src="/siger-kan-mark.svg" alt="" width={34} height={34} priority /></span>
        <span><strong className="block text-base leading-none">SIGER-KAN</strong><small className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[.14em] text-aqua">Gerai Mutu dan Perikanan</small></span>
      </Link>

      <nav aria-label="Navigasi dashboard" className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-2">
          {navigation.map((group) => {
            const isOpen = !collapsedGroups.includes(group.label);
            const containsActiveRoute = group.items.some(({ href }) => isDashboardRouteActive(pathname, href));
            const GroupIcon = iconMap[group.icon];
            return (
              <section key={group.label}>
                <button type="button" onClick={() => toggleGroup(group.label)} aria-expanded={isOpen} className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[11px] font-bold uppercase tracking-[.1em] transition focus-visible:outline-2 focus-visible:outline-aqua ${containsActiveRoute ? "text-aqua" : "text-white/52 hover:text-white"}`}>
                  <GroupIcon className="h-4 w-4" />
                  <span className="flex-1">{group.label}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => {
                      const active = isDashboardRouteActive(pathname, item.href);
                      const ItemIcon = iconMap[item.icon];
                      return (
                        <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-aqua ${active ? "bg-white text-navy shadow-sm" : "text-white/72 hover:bg-white/8 hover:text-white"}`}>
                          <ItemIcon className={`h-[18px] w-[18px] ${active ? "text-ocean" : "text-aqua/80"}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[10px] leading-4 text-white/45">Platform layanan mutu perikanan terintegrasi</div>
    </div>
  );
}
