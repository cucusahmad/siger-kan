"use client";

import { AlertCircle, CheckCircle2, Clock3, FileCheck2, FileWarning, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BusinessDocumentSection, type BusinessDocumentDto } from "./BusinessDocumentSection";

interface BusinessLegalDocumentsPageProps {
  readonly businessName: string;
  readonly initialDocuments: readonly BusinessDocumentDto[];
  readonly canManage: boolean;
}

interface DocumentsResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: readonly BusinessDocumentDto[];
}

const requiredDocuments = [
  { type: "NIB", label: "Nomor Induk Berusaha", description: "Identitas utama usaha yang diterbitkan melalui OSS." },
  { type: "TAX_ID", label: "NPWP", description: "Dokumen administrasi perpajakan badan atau pemilik usaha." },
  { type: "BUSINESS_LICENSE", label: "SIUP / Izin Usaha", description: "Izin operasional sesuai bidang dan skala kegiatan usaha." },
] as const;

export function BusinessLegalDocumentsPage({ businessName, initialDocuments, canManage }: BusinessLegalDocumentsPageProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly text: string } | null>(null);

  const summary = useMemo(() => {
    const now = new Date().toLocaleDateString("sv-SE");
    return {
      verified: documents.filter(({ verificationStatus }) => verificationStatus === "VERIFIED").length,
      pending: documents.filter(({ verificationStatus }) => verificationStatus === "PENDING").length,
      needsAttention: documents.filter(({ verificationStatus, expiresAt }) => verificationStatus === "REJECTED" || Boolean(expiresAt && expiresAt < now)).length,
      requiredCompleted: requiredDocuments.filter(({ type }) => documents.some((document) => document.documentType === type && document.fileAvailable)).length,
    };
  }, [documents]);

  const refreshDocuments = async () => {
    const response = await fetch("/api/business/documents", { cache: "no-store" });
    const result = await response.json() as DocumentsResponse;
    if (!response.ok || !result.data) throw new Error(result.message || "Dokumen gagal dimuat ulang.");
    setDocuments(result.data);
  };

  const showFeedback = (kind: "success" | "error", text: string) => {
    setFeedback({ kind, text });
    window.setTimeout(() => setFeedback(null), 5000);
  };

  const completionPercentage = Math.round((summary.requiredCompleted / requiredDocuments.length) * 100);

  return (
    <div className="space-y-7">
      <DashboardPageHeader eyebrow="Pelaku Usaha" title="Legalitas Usaha" description={`Kelola dokumen legalitas ${businessName}, pantau masa berlaku, dan tindak lanjuti hasil verifikasi dalam satu tempat.`} />

      {feedback && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${feedback.kind === "success" ? "border-[#2E9F6B]/25 bg-[#F0FAF5] text-[#20764F]" : "border-[#E63946]/25 bg-[#FFF4F5] text-[#B42332]"}`}>
          {feedback.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <p className="font-semibold">{feedback.text}</p>
        </div>
      )}

      <section aria-label="Ringkasan legalitas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<FileCheck2 className="h-5 w-5" />} label="Total Dokumen" value={documents.length.toString()} tone="ocean" />
        <SummaryCard icon={<ShieldCheck className="h-5 w-5" />} label="Terverifikasi" value={summary.verified.toString()} tone="success" />
        <SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Menunggu Verifikasi" value={summary.pending.toString()} tone="warning" />
        <SummaryCard icon={<FileWarning className="h-5 w-5" />} label="Perlu Perhatian" value={summary.needsAttention.toString()} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <BusinessDocumentSection documents={documents} canManage={canManage} onChanged={refreshDocuments} onFeedback={showFeedback} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-navy p-6 text-white shadow-lg shadow-navy/10">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-aqua">Dokumen Utama</p>
            <div className="mt-4 flex items-end justify-between gap-4"><strong className="text-3xl">{summary.requiredCompleted}/{requiredDocuments.length}</strong><span className="text-sm text-white/70">{completionPercentage}% lengkap</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-aqua transition-[width]" style={{ width: `${completionPercentage}%` }} /></div>
            <ul className="mt-5 space-y-4">
              {requiredDocuments.map((item) => {
                const completed = documents.some((document) => document.documentType === item.type && document.fileAvailable);
                return <li key={item.type} className="flex gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${completed ? "bg-[#2E9F6B]" : "bg-white/10"}`}><CheckCircle2 className="h-4 w-4" /></span><div><p className="text-sm font-bold">{item.label}</p><p className="mt-1 text-xs leading-5 text-white/65">{item.description}</p></div></li>;
              })}
            </ul>
          </div>
          <div className="rounded-3xl border border-ocean/15 bg-seafoam/45 p-5">
            <h2 className="font-bold text-navy">Keamanan dokumen</h2>
            <p className="mt-2 text-sm leading-6 text-muted">File disimpan secara privat. Akses lihat dan unduh hanya tersedia bagi pengguna yang memiliki izin pada usaha ini.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

const toneClasses = {
  ocean: "bg-seafoam text-ocean",
  success: "bg-[#EAF7F0] text-[#2E9F6B]",
  warning: "bg-[#FFF8E7] text-[#A56C00]",
  danger: "bg-[#FFF0F1] text-[#D33643]",
} as const;

function SummaryCard({ icon, label, value, tone }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string; readonly tone: keyof typeof toneClasses }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>{icon}</div><p className="mt-4 text-2xl font-bold text-navy">{value}</p><p className="mt-1 text-sm font-medium text-muted">{label}</p></article>;
}
