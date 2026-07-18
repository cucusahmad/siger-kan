import { Construction } from "lucide-react";

import { DashboardPageHeader } from "./dashboard-page-header";

interface DashboardPlaceholderPageProps {
  readonly title: string;
  readonly description: string;
}

export function DashboardPlaceholderPage({ title, description }: DashboardPlaceholderPageProps) {
  return (
    <div>
      <DashboardPageHeader eyebrow="Modul SIGER-KAN" title={title} description={description} />
      <section className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white px-6 py-12 text-center shadow-[0_12px_40px_rgba(7,59,76,.05)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-seafoam text-ocean"><Construction className="h-6 w-6" /></span>
        <h2 className="mt-5 text-lg font-bold text-navy">Fitur sedang dikembangkan</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">Halaman ini telah disiapkan sebagai bagian dari navigasi dashboard. Fungsi layanan akan tersedia pada tahap pengembangan berikutnya.</p>
      </section>
    </div>
  );
}
