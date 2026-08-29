"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, LoaderCircle, RotateCcw, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AiResponseContent } from "./AiResponseContent";

const questionSchema = z.object({ question: z.string().trim().min(3, "Pertanyaan minimal 3 karakter.").max(4_000, "Pertanyaan maksimal 4.000 karakter.") });
type QuestionForm = z.infer<typeof questionSchema>;

interface ChatMessage { readonly id: string; readonly role: "user" | "assistant"; readonly content: string }
interface ChatApiResponse { readonly success: boolean; readonly message: string; readonly data?: { readonly answer: string; readonly model: string } }

const starterQuestions = [
  "Apa yang perlu disiapkan sebelum mengajukan pengujian mutu?",
  "Jelaskan prinsip penanganan ikan yang baik setelah panen.",
  "Apa perbedaan pengujian mutu dan sertifikasi produk?",
] as const;

export function AiConsultation() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<QuestionForm>({ resolver: zodResolver(questionSchema), defaultValues: { question: "" } });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSubmitting]);

  const submitQuestion = handleSubmit(async ({ question }) => {
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setRequestError(null); reset();
    try {
      const response = await fetch("/api/ai-knowledge/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12).map(({ role, content }) => ({ role, content })) }),
      });
      const payload = await response.json() as ChatApiResponse;
      if (!response.ok || !payload.data) throw new Error(payload.message || "Jawaban AI gagal dibuat.");
      const answer = payload.data.answer;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: answer }]);
    } catch (error: unknown) {
      setRequestError(error instanceof Error ? error.message : "Terjadi gangguan saat menghubungi layanan AI.");
    }
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(7,59,76,.08)]" aria-label="Percakapan Konsultasi AI">
        <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-navy to-ocean px-5 py-4 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12"><Bot className="h-6 w-6 text-aqua" /></span>
          <div><h2 className="font-bold">Asisten AI SIGER-KAN</h2><p className="text-xs text-white/65">Didukung Hugging Face Inference Providers</p></div>
          {messages.length > 0 && <button type="button" onClick={() => { setMessages([]); setRequestError(null); }} className="ml-auto flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white/75 hover:bg-white/10 hover:text-white" aria-label="Mulai percakapan baru"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Percakapan baru</span></button>}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-seafoam text-ocean"><Sparkles className="h-8 w-8" /></span>
            <h3 className="mt-5 text-xl font-bold text-navy">Apa yang ingin Anda konsultasikan?</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Mulai dengan salah satu topik berikut atau tulis pertanyaan Anda sendiri.</p>
            <div className="mt-6 grid w-full gap-2">{starterQuestions.map((question) => <button key={question} type="button" onClick={() => setValue("question", question, { shouldValidate: true })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-aqua hover:bg-seafoam/40">{question}</button>)}</div>
          </div>}
          {messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-aqua"><Bot className="h-5 w-5" /></span>}
            <div className={`min-w-0 max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "whitespace-pre-wrap rounded-br-md bg-ocean text-white" : "rounded-bl-md border border-slate-200 bg-white text-ink"}`}>{message.role === "assistant" ? <AiResponseContent content={message.content} /> : message.content}</div>
            {message.role === "user" && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><UserRound className="h-5 w-5" /></span>}
          </div>)}
          {isSubmitting && <div className="flex items-center gap-3 text-sm text-muted"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-aqua"><Bot className="h-5 w-5" /></span><LoaderCircle className="h-4 w-4 animate-spin" />Menyusun jawaban…</div>}
          {requestError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{requestError}</div>}
          <div ref={endRef} />
        </div>

        <form onSubmit={submitQuestion} className="border-t border-slate-100 bg-white p-4 sm:p-5">
          <div className="flex items-end gap-3">
            <div className="flex-1"><label htmlFor="ai-question" className="sr-only">Pertanyaan konsultasi</label><textarea id="ai-question" rows={2} disabled={isSubmitting} placeholder="Tulis pertanyaan tentang mutu dan perikanan…" className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-teal focus:ring-4 focus:ring-teal/10 disabled:bg-slate-50" {...register("question")} />{errors.question && <p className="mt-1 text-xs text-red-600">{errors.question.message}</p>}</div>
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-50" aria-label="Kirim pertanyaan">{isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
          </div>
          <p className="mt-2 text-[11px] text-muted">Hindari memasukkan data pribadi, rahasia usaha, kata sandi, atau token.</p>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><ShieldCheck className="h-6 w-6 text-ocean" /><h2 className="mt-3 font-bold text-navy">Gunakan dengan bijak</h2><p className="mt-2 text-sm leading-6 text-muted">Jawaban AI bersifat informatif dan dapat keliru. Verifikasi standar, regulasi, persyaratan, dan keputusan layanan kepada petugas atau dokumen resmi.</p></div>
        <div className="rounded-3xl bg-seafoam/70 p-5"><h2 className="font-bold text-navy">Topik yang dapat dibahas</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted"><li>Mutu dan keamanan hasil perikanan</li><li>Persiapan pengujian laboratorium</li><li>Informasi umum sertifikasi</li><li>Penanganan dan proses produksi</li><li>Panduan layanan SIGER-KAN</li></ul></div>
      </aside>
    </div>
  );
}
