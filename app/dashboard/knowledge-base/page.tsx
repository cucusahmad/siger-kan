import type { Metadata } from "next";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AiConsultation } from "@/components/dashboard/knowledge-base/AiConsultation";

export const metadata: Metadata = { title: "Konsultasi AI" };

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-7">
      <DashboardPageHeader eyebrow="AI Knowledge" title="Konsultasi AI" description="Tanyakan informasi umum seputar mutu, keamanan, pengujian, sertifikasi, dan layanan perikanan kepada asisten digital SIGER-KAN." />
      <AiConsultation />
    </div>
  );
}
