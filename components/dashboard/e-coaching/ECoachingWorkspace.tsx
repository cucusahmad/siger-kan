"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Download, MessageSquareText, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { createConsultationSchema, type CreateConsultationInput } from "@/features/e-coaching/e-coaching.schema";
import type { ConsultationAttachmentView, ConsultationPageData, ConsultationView } from "@/features/e-coaching/e-coaching.types";

interface ECoachingWorkspaceProps { readonly initialData: ConsultationPageData }
interface ConsultationResponse { readonly success: boolean; readonly message: string; readonly data?: ConsultationView }

const statusLabels: Readonly<Record<string, string>> = { WAITING: "Menunggu konsultan", IN_PROGRESS: "Menunggu tindak lanjut", ANSWERED: "Sudah dijawab", CLOSED: "Selesai" };
const categoryLabels: Readonly<Record<string, string>> = { CERTIFICATION: "Sertifikasi", TEST_RESULT: "Hasil Uji", QUALITY_CLINIC: "Mutu dan Keamanan Pangan", BUSINESS_DEVELOPMENT: "Pengembangan Usaha", OTHER: "Lainnya" };

function statusStyle(status: string): string {
  if (status === "WAITING") return "bg-[#FFF7E1] text-[#8A6412]";
  if (status === "ANSWERED" || status === "CLOSED") return "bg-[#E5F6ED] text-[#237552]";
  return "bg-[#E6F5F7] text-ocean";
}

function formatSize(value: string): string {
  const bytes = Number(value);
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentList({ attachments }: { readonly attachments: readonly ConsultationAttachmentView[] }) {
  if (attachments.length === 0) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{attachments.map((file) => <a key={file.id} href={file.downloadUrl} className="inline-flex items-center gap-2 rounded-xl border border-ocean/15 bg-white px-3 py-2 text-xs font-semibold text-ocean hover:bg-seafoam"><Download className="h-3.5 w-3.5" /><span className="max-w-48 truncate">{file.fileName}</span><span className="text-muted">{formatSize(file.fileSize)}</span></a>)}</div>;
}

export function ECoachingWorkspace({ initialData }: ECoachingWorkspaceProps) {
  const { isConsultant } = initialData;
  const [consultations, setConsultations] = useState<readonly ConsultationView[]>(initialData.consultations);
  const [selectedId, setSelectedId] = useState(initialData.consultations[0]?.id ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [newFiles, setNewFiles] = useState<readonly File[]>([]);
  const [responseFiles, setResponseFiles] = useState<readonly File[]>([]);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selected = consultations.find(({ id }) => id === selectedId) ?? consultations[0] ?? null;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateConsultationInput>({ resolver: zodResolver(createConsultationSchema), defaultValues: { subject: "", category: "QUALITY_CLINIC", question: "" } });

  async function send(url: string, method: "POST" | "PATCH", formData: FormData): Promise<ConsultationResponse> {
    try {
      const result = await fetch(url, { method, body: formData });
      return await result.json() as ConsultationResponse;
    } catch {
      return { success: false, message: "Koneksi ke layanan konsultasi gagal. Silakan coba kembali." };
    }
  }

  function replace(updated: ConsultationView) {
    setConsultations((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  const submitNew = handleSubmit(async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    newFiles.forEach((file) => formData.append("files", file));
    setIsSubmitting(true);
    setFeedback("");
    const body = await send("/api/e-coaching/consultations", "POST", formData);
    if (body.success && body.data) {
      const created = body.data;
      setConsultations((current) => [created, ...current]);
      setSelectedId(created.id);
      reset();
      setNewFiles([]);
      setIsCreating(false);
    }
    setFeedback(body.message);
    setIsSubmitting(false);
  });

  async function submitResponse() {
    if (!selected || response.trim().length < 5) { setFeedback("Jawaban minimal 5 karakter."); return; }
    const formData = new FormData();
    formData.set("action", "RESPOND");
    formData.set("message", response.trim());
    responseFiles.forEach((file) => formData.append("files", file));
    setIsSubmitting(true);
    const body = await send(`/api/e-coaching/consultations/${selected.id}`, "PATCH", formData);
    if (body.success && body.data) { replace(body.data); setResponse(""); setResponseFiles([]); }
    setFeedback(body.message);
    setIsSubmitting(false);
  }

  async function closeConsultation() {
    if (!selected) return;
    const formData = new FormData();
    formData.set("action", "CLOSE");
    setIsSubmitting(true);
    const body = await send(`/api/e-coaching/consultations/${selected.id}`, "PATCH", formData);
    if (body.success && body.data) replace(body.data);
    setFeedback(body.message);
    setIsSubmitting(false);
  }

  return <div>
    <DashboardPageHeader eyebrow="E-Pembinaan" title="Konsultasi Daring" description={isConsultant ? "Jawab pertanyaan pelaku usaha secara daring beserta dokumen pendukungnya, tanpa penjadwalan pertemuan." : "Sampaikan pertanyaan kepada konsultan secara daring dan sertakan dokumen pendukung bila diperlukan."} actions={!isConsultant && <button type="button" onClick={() => setIsCreating((value) => !value)} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-ocean"><MessageSquareText className="mr-2 inline h-4 w-4" />Buat pertanyaan</button>} />

    {isCreating && <form onSubmit={submitNew} className="mt-7 rounded-3xl border border-aqua/40 bg-white p-5 shadow-[0_12px_40px_rgba(7,59,76,.06)] sm:p-6">
      <h2 className="font-bold text-navy">Pertanyaan baru</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-navy">Subjek<input {...register("subject")} className="input" maxLength={180} aria-invalid={Boolean(errors.subject)} />{errors.subject && <span className="mt-1 block text-xs text-danger">{errors.subject.message}</span>}</label>
        <label className="text-sm font-bold text-navy">Kategori<select {...register("category")} className="input">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <label className="mt-4 block text-sm font-bold text-navy">Pertanyaan<textarea {...register("question")} rows={4} className="input resize-none" maxLength={5000} aria-invalid={Boolean(errors.question)} />{errors.question && <span className="mt-1 block text-xs text-danger">{errors.question.message}</span>}</label>
      <label className="mt-4 block text-sm font-bold text-navy">Lampiran (opsional)<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(event) => setNewFiles(Array.from(event.target.files ?? []).slice(0, 3))} className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-seafoam file:px-4 file:py-2.5 file:font-bold file:text-ocean" /><span className="mt-1 block text-xs font-normal text-muted">Maksimal 3 berkas, masing-masing 10 MB. Format PDF, JPG, PNG, atau DOCX.</span></label>
      <button type="submit" disabled={isSubmitting} className="mt-4 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="mr-2 inline h-4 w-4" />Kirim pertanyaan</button>
    </form>}

    <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(7,59,76,.05)]">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-navy">{isConsultant ? "Pertanyaan masuk" : "Riwayat konsultasi daring"}</h2><p className="mt-1 text-xs text-muted">Pilih pertanyaan untuk melihat detail dan lampiran.</p></div>
        <div className="divide-y divide-slate-100">{consultations.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setFeedback(""); }} className={`w-full p-5 text-left hover:bg-slate-50 ${selected?.id === item.id ? "bg-[#F0FAFA]" : ""}`}><div className="flex flex-wrap items-start justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wider text-ocean">{categoryLabels[item.category] ?? item.category}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(item.status)}`}>{statusLabels[item.status] ?? item.status}</span></div><h3 className="mt-3 font-bold text-navy">{item.subject}</h3><p className="mt-1 text-sm text-muted">{item.businessName} · {new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></button>)}</div>
      </div>

      {selected ? <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(7,59,76,.05)] sm:p-6">
        <div className="flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyle(selected.status)}`}>{statusLabels[selected.status] ?? selected.status}</span><span className="text-xs text-muted">#{selected.id.padStart(4, "0")}</span></div>
        <h2 className="mt-4 text-lg font-bold text-navy">{selected.subject}</h2><p className="mt-2 text-sm leading-6 text-muted">{selected.question}</p><AttachmentList attachments={selected.attachments} />
        {selected.messages.map((message) => <div key={message.id} className={`mt-4 rounded-2xl p-4 ${message.isConsultant ? "bg-[#F0FAFA]" : "bg-slate-50"}`}><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ocean"><CheckCircle2 className="h-4 w-4" />{message.senderName}</p><p className="mt-2 text-sm leading-6 text-ink">{message.message}</p><AttachmentList attachments={message.attachments} /></div>)}
        {isConsultant && selected.status !== "CLOSED" && <div className="mt-6 border-t border-slate-100 pt-5"><label htmlFor="consultant-response" className="text-sm font-bold text-navy">Jawaban konsultasi</label><textarea id="consultant-response" value={response} onChange={(event) => setResponse(event.target.value)} rows={4} className="input resize-none" placeholder="Tuliskan arahan yang jelas dan dapat ditindaklanjuti..." /><label className="mt-3 block text-sm font-bold text-navy"><Paperclip className="mr-2 inline h-4 w-4" />Lampiran jawaban (opsional)<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(event) => setResponseFiles(Array.from(event.target.files ?? []).slice(0, 3))} className="mt-2 block w-full text-xs text-muted" /></label><button type="button" disabled={isSubmitting} onClick={submitResponse} className="mt-3 rounded-xl bg-ocean px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="mr-2 inline h-4 w-4" />Kirim jawaban</button></div>}
        {selected.status !== "CLOSED" && <button type="button" disabled={isSubmitting} onClick={closeConsultation} className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-muted hover:bg-slate-100 disabled:opacity-50">Tandai konsultasi selesai</button>}
        {feedback && <p aria-live="polite" className="mt-4 text-sm font-semibold text-ocean">{feedback}</p>}
      </article> : <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white p-8 text-center text-sm text-muted">Belum ada konsultasi daring.</div>}
    </section>
  </div>;
}
