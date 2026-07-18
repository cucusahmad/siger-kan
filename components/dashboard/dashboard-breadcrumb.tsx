"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getDashboardBreadcrumbs } from "./dashboard-navigation";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {breadcrumbs.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            {item.href ? <Link href={item.href} className="flex items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-ocean hover:text-ocean">{index === 0 && <Home className="h-3.5 w-3.5" />}{item.label}</Link> : <span aria-current="page" className="font-semibold text-ink">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
