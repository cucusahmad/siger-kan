import type { LucideIcon } from "lucide-react";

import type { ExecutiveBreakdown } from "@/features/executive-dashboard/executive-dashboard.types";

const statusLabels: Readonly<Record<string, string>> = {
  ACCEPTED: "Diterima",
  AUDIT_COMPLETED: "Audit Selesai",
  BERLAKU: "Berlaku",
  CORRECTIVE_ACTION_VERIFIED: "Tindakan Perbaikan Terverifikasi",
  DICABUT: "Dicabut",
  DIAJUKAN: "Diajukan",
  DALAM_PENGUJIAN: "Dalam Pengujian",
  DITOLAK: "Ditolak",
  DRAFT: "Draf",
  KAJI_ULANG: "Kaji Ulang",
  KEDALUWARSA: "Kedaluwarsa",
  MENUNGGU_PERSETUJUAN_UPTD: "Menunggu Persetujuan UPTD",
  MENUNGGU_SAMPEL: "Menunggu Sampel",
  PENDING: "Menunggu",
  REJECTED: "Ditolak",
  REVISION: "Perlu Revisi",
  SAMPEL_DIKIRIM: "Sampel Dikirim",
  SAMPEL_DITERIMA: "Sampel Diterima",
  SELESAI: "Selesai",
};

interface MetricCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: number | string;
  readonly detail: string;
  readonly tone?: "primary" | "success" | "warning";
}

export function MetricCard({ icon: Icon, label, value, detail, tone = "primary" }: MetricCardProps) {
  const tones = {
    primary: "bg-seafoam text-ocean",
    success: "bg-[#EAF7F0] text-[#247D55]",
    warning: "bg-[#FFF7E2] text-[#8A6411]",
  } as const;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(7,59,76,.05)]">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-5 text-3xl font-bold text-navy">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
      <p className="mt-1 text-sm font-bold text-ink">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </article>
  );
}

export function StatusDistribution({ title, subtitle, data }: { readonly title: string; readonly subtitle: string; readonly data: readonly ExecutiveBreakdown[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>
      <div className="mt-6 space-y-5">
        {data.map((item) => {
          const percentage = total ? Math.round((item.value / total) * 100) : 0;
          return <div key={item.label}><div className="mb-2 flex justify-between gap-4 text-xs"><span className="font-semibold text-ink">{humanizeStatus(item.label)}</span><span className="font-bold text-navy">{item.value.toLocaleString("id-ID")} <span className="font-medium text-muted">({percentage}%)</span></span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ocean" style={{ width: `${percentage}%` }} /></div></div>;
        })}
        {!data.length && <p className="py-8 text-center text-sm text-muted">Data belum tersedia.</p>}
      </div>
    </section>
  );
}

export function humanizeStatus(value: string): string {
  return statusLabels[value] ?? value.replaceAll("_", " ").toLocaleLowerCase("id-ID").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("id-ID"));
}

export function formatExecutiveDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export function statusClass(value: string): string {
  if (["ACCEPTED", "AUDIT_COMPLETED", "BERLAKU", "CORRECTIVE_ACTION_VERIFIED", "SELESAI", "DISETUJUI"].includes(value)) return "bg-[#EAF7F0] text-[#247D55]";
  if (["DICABUT", "KEDALUWARSA", "REJECTED", "DITOLAK"].includes(value)) return "bg-[#FFF0F2] text-[#B64A55]";
  return "bg-[#FFF7E2] text-[#8A6411]";
}
