import type { Metadata } from "next";

import { DashboardPlaceholderPage } from "@/components/dashboard/dashboard-placeholder-page";

export const metadata: Metadata = { title: "Verifikasi Hasil" };

export default function ResultVerificationPage() {
  return (
    <DashboardPlaceholderPage
      title="Verifikasi Hasil"
      description="Tinjau dan verifikasi hasil pengujian sebelum laporan diterbitkan."
    />
  );
}
