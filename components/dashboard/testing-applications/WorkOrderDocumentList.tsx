"use client";

import { FileText, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WorkOrderDocument { readonly id: string; readonly type: string; readonly fileName: string; readonly fileSize: string }
interface WorkOrderDocumentListProps { readonly workOrderId: string; readonly documents: readonly WorkOrderDocument[]; readonly canDelete: boolean }

export function WorkOrderDocumentList({ workOrderId, documents, canDelete }: WorkOrderDocumentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function deleteDocument(document: WorkOrderDocument) {
    if (!window.confirm(`Hapus dokumen "${document.fileName}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(document.id); setMessage("");
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/documents?documentId=${document.id}`, { method: "DELETE" });
      const result = await response.json() as { readonly success: boolean; readonly message: string };
      setMessage(result.message); if (response.ok && result.success) router.refresh();
    } catch { setMessage("Dokumen gagal dihapus. Silakan coba kembali."); } finally { setDeletingId(null); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-[#073B4C]"><FileText size={18}/> Dokumen Hasil ({documents.length})</h2>{message && <p role="status" className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm text-[#073B4C]">{message}</p>}<div className="mt-4 space-y-2">{documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{document.fileName}</p><p className="mt-1 text-xs text-slate-500">{document.type.replaceAll("_", " ")} · {(Number(document.fileSize) / 1_048_576).toFixed(1)} MB</p></div>{canDelete && <button type="button" disabled={deletingId !== null} onClick={() => void deleteDocument(document)} aria-label={`Hapus ${document.fileName}`} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">{deletingId === document.id ? <LoaderCircle size={17} className="animate-spin"/> : <Trash2 size={17}/>}</button>}</div>)}{!documents.length && <p className="text-sm text-slate-500">Belum ada dokumen yang diunggah.</p>}</div></section>;
}
