import type { Metadata } from "next";

import { DashboardPlaceholderPage } from "@/components/dashboard/dashboard-placeholder-page";

export const metadata: Metadata = { title: "Unduh Laporan Hasil Uji" };

export default function TestingReportsPage() {
  return (
    <DashboardPlaceholderPage
      title="Unduh Laporan Hasil Uji"
      description="Akses dan unduh Laporan Hasil Uji yang telah diterbitkan."
    />
  );
}
