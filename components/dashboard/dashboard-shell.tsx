"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { DashboardFooter } from "./dashboard-footer";
import { DashboardHeader } from "./dashboard-header";
import { DashboardMobileNav } from "./dashboard-mobile-nav";
import { getDashboardPageTitle, type DashboardNavigationGroup } from "./dashboard-navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import type { DashboardUserSummary } from "./dashboard-user-menu";

interface DashboardShellProps {
  readonly children: ReactNode;
  readonly navigation: readonly DashboardNavigationGroup[];
  readonly user: DashboardUserSummary;
}

export function DashboardShell({ children, navigation, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const closeMobileNavigation = useCallback(() => setIsMobileNavigationOpen(false), []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block"><DashboardSidebar navigation={navigation} /></aside>
      <DashboardMobileNav isOpen={isMobileNavigationOpen} navigation={navigation} onClose={closeMobileNavigation} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
        <DashboardHeader pageTitle={getDashboardPageTitle(pathname)} user={user} onOpenNavigation={() => setIsMobileNavigationOpen(true)} />
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <DashboardBreadcrumb />
            <div className="mt-5">{children}</div>
          </div>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
