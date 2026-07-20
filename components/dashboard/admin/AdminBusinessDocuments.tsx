"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BusinessDocumentSection, type BusinessDocumentDto } from "@/components/dashboard/business/BusinessDocumentSection";

interface AdminBusinessDocumentsProps {
  readonly documents: readonly BusinessDocumentDto[];
}

export function AdminBusinessDocuments({ documents }: AdminBusinessDocumentsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ readonly kind: "success" | "error"; readonly text: string } | null>(null);

  const refreshDocuments = async () => { router.refresh(); };
  const showFeedback = (kind: "success" | "error", text: string) => {
    setFeedback({ kind, text });
    window.setTimeout(() => setFeedback(null), 5000);
  };

  return <>
    {feedback && <div role="status" className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${feedback.kind === "success" ? "border-[#2E9F6B]/25 bg-[#F0FAF5] text-[#20764F]" : "border-[#E63946]/25 bg-[#FFF4F5] text-[#B42332]"}`}>
      {feedback.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
      <p className="font-semibold">{feedback.text}</p>
    </div>}
    <BusinessDocumentSection documents={documents} canManage allowCreate={false} onChanged={refreshDocuments} onFeedback={showFeedback} />
  </>;
}
