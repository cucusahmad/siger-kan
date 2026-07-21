import type { Metadata } from "next";

import { DashboardPlaceholderPage } from "@/components/dashboard/dashboard-placeholder-page";

export const metadata: Metadata = { title: "Tracking Proses Laboratorium" };

export default function LaboratoryTrackingPage() {
  return (
    <DashboardPlaceholderPage
      title="Tracking Proses Laboratorium"
      description="Pantau tahapan dan perkembangan proses pengujian sampel di laboratorium."
    />
  );
}
