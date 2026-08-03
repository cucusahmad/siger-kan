"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { createClinicAppointmentSchema, type CreateClinicAppointmentFormInput, type CreateClinicAppointmentInput } from "@/features/quality-clinic/quality-clinic.schema";
import type { ClinicAppointmentPageData, ClinicAppointmentView } from "@/features/quality-clinic/quality-clinic.types";

interface QualityClinicWorkspaceProps { readonly initialData: ClinicAppointmentPageData }
interface AppointmentResponse { readonly success: boolean; readonly message: string; readonly data?: ClinicAppointmentView }

const statusLabels: Readonly<Record<string, string>> = { PENDING: "Menunggu konfirmasi", CONFIRMED: "Terjadwal", COMPLETED: "Selesai", REJECTED: "Ditolak", CANCELLED: "Dibatalkan" };

function dateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
}

function statusClass(status: string): string {
  if (status === "CONFIRMED" || status === "COMPLETED") return "bg-[#E5F6ED] text-[#237552]";
  if (status === "REJECTED" || status === "CANCELLED") return "bg-red-50 text-danger";
  return "bg-[#FFF7E1] text-[#8A6412]";
}

export function QualityClinicWorkspace({ initialData }: QualityClinicWorkspaceProps) {
  const { isConsultant } = initialData;
  const [appointments, setAppointments] = useState<readonly ClinicAppointmentView[]>(initialData.appointments);
  const [selectedId, setSelectedId] = useState(initialData.appointments[0]?.id ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [consultantNote, setConsultantNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selected = appointments.find(({ id }) => id === selectedId) ?? appointments[0] ?? null;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClinicAppointmentFormInput, unknown, CreateClinicAppointmentInput>({ resolver: zodResolver(createClinicAppointmentSchema), defaultValues: { topic: "", description: "" } });

  async function request(url: string, method: "POST" | "PATCH", payload: Readonly<Record<string, string>>): Promise<AppointmentResponse> {
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return await response.json() as AppointmentResponse;
    } catch {
      return { success: false, message: "Koneksi ke layanan Klinik Mutu gagal. Silakan coba kembali." };
    }
  }

  const submitNew = handleSubmit(async (values) => {
    setIsSubmitting(true); setFeedback("");
    const body = await request("/api/quality-clinic/appointments", "POST", { topic: values.topic, description: values.description, preferredAt: values.preferredAt.toISOString() });
    if (body.success && body.data) { setAppointments((current) => [body.data!, ...current]); setSelectedId(body.data.id); reset(); setIsCreating(false); }
    setFeedback(body.message); setIsSubmitting(false);
  });

  async function update(action: "CONFIRM" | "COMPLETE" | "REJECT" | "CANCEL") {
    if (!selected) return;
    const payload: Record<string, string> = { action };
    if (action === "CONFIRM") { payload.scheduledAt = scheduledAt; payload.location = location; payload.consultantNote = consultantNote; }
    if (action === "COMPLETE" || action === "REJECT") payload.consultantNote = consultantNote;
    setIsSubmitting(true); setFeedback("");
    const body = await request(`/api/quality-clinic/appointments/${selected.id}`, "PATCH", payload);
    if (body.success && body.data) setAppointments((current) => current.map((item) => item.id === body.data!.id ? body.data! : item));
    setFeedback(body.message); setIsSubmitting(false);
  }

  return <div>
    <DashboardPageHeader eyebrow="E-Pembinaan" title="Klinik Mutu" description={isConsultant ? "Kelola dan konfirmasi jadwal pertemuan langsung dengan pelaku usaha." : "Ajukan konsultasi di tempat dan hadiri pertemuan sesuai jadwal yang dikonfirmasi konsultan."} actions={!isConsultant && <button type="button" onClick={() => setIsCreating((value) => !value)} className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-ocean"><CalendarDays className="mr-2 inline h-4 w-4" />Ajukan jadwal</button>} />
    {isCreating && <form onSubmit={submitNew} className="mt-7 rounded-3xl border border-aqua/40 bg-white p-6 shadow-[0_12px_40px_rgba(7,59,76,.06)]">
      <h2 className="font-bold text-navy">Pengajuan pertemuan baru</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-navy">Topik<input {...register("topic")} className="input" maxLength={180} />{errors.topic && <span className="mt-1 block text-xs text-danger">{errors.topic.message}</span>}</label><label className="text-sm font-bold text-navy">Pilihan jadwal<input {...register("preferredAt")} type="datetime-local" className="input" />{errors.preferredAt && <span className="mt-1 block text-xs text-danger">{errors.preferredAt.message}</span>}</label></div>
      <label className="mt-4 block text-sm font-bold text-navy">Kebutuhan konsultasi<textarea {...register("description")} rows={4} className="input resize-none" maxLength={5000} />{errors.description && <span className="mt-1 block text-xs text-danger">{errors.description.message}</span>}</label>
      <button type="submit" disabled={isSubmitting} className="mt-4 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="mr-2 inline h-4 w-4" />Kirim pengajuan</button>
    </form>}
    <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-navy">{isConsultant ? "Pengajuan pertemuan" : "Jadwal pertemuan saya"}</h2></div><div className="divide-y divide-slate-100">{appointments.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setFeedback(""); }} className={`w-full p-5 text-left hover:bg-slate-50 ${selected?.id === item.id ? "bg-[#F0FAFA]" : ""}`}><div className="flex justify-between gap-3"><h3 className="font-bold text-navy">{item.topic}</h3><span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(item.status)}`}>{statusLabels[item.status]}</span></div><p className="mt-2 text-sm text-muted">{item.businessName} · {dateTime(item.scheduledAt ?? item.preferredAt)}</p></button>)}</div></div>
      {selected ? <article className="rounded-3xl border border-slate-200/80 bg-white p-6"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(selected.status)}`}>{statusLabels[selected.status]}</span><h2 className="mt-4 text-lg font-bold text-navy">{selected.topic}</h2><p className="mt-2 text-sm leading-6 text-muted">{selected.description}</p><div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><p className="flex gap-2"><Clock3 className="h-4 w-4 text-ocean" /><span><strong>Pilihan:</strong> {dateTime(selected.preferredAt)}</span></p>{selected.scheduledAt && <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-ocean" /><span><strong>Jadwal:</strong> {dateTime(selected.scheduledAt)}</span></p>}{selected.location && <p className="flex gap-2"><MapPin className="h-4 w-4 text-ocean" /><span><strong>Lokasi:</strong> {selected.location}</span></p>}{selected.consultantNote && <p><strong>Catatan konsultan:</strong> {selected.consultantNote}</p>}</div>
        {isConsultant && (selected.status === "PENDING" || selected.status === "CONFIRMED") && <div className="mt-5 border-t border-slate-100 pt-5"><label className="block text-sm font-bold text-navy">Jadwal pertemuan<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input" /></label><label className="mt-3 block text-sm font-bold text-navy">Lokasi<input value={location} onChange={(event) => setLocation(event.target.value)} className="input" placeholder="Contoh: Klinik Mutu UPTD PMHP" /></label><label className="mt-3 block text-sm font-bold text-navy">Catatan<textarea value={consultantNote} onChange={(event) => setConsultantNote(event.target.value)} rows={3} className="input resize-none" /></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={isSubmitting || !scheduledAt || location.trim().length < 5} onClick={() => update("CONFIRM")} className="rounded-xl bg-ocean px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-2 inline h-4 w-4" />Konfirmasi jadwal</button>{selected.status === "CONFIRMED" && <button type="button" disabled={isSubmitting} onClick={() => update("COMPLETE")} className="rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white">Selesaikan</button>}<button type="button" disabled={isSubmitting || consultantNote.trim().length < 5} onClick={() => update("REJECT")} className="rounded-xl px-4 py-2.5 text-sm font-bold text-danger hover:bg-red-50"><XCircle className="mr-2 inline h-4 w-4" />Tolak</button></div></div>}
        {!isConsultant && (selected.status === "PENDING" || selected.status === "CONFIRMED") && <button type="button" disabled={isSubmitting} onClick={() => update("CANCEL")} className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-danger hover:bg-red-50">Batalkan pengajuan</button>}{feedback && <p aria-live="polite" className="mt-4 text-sm font-semibold text-ocean">{feedback}</p>}</article> : <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white p-8 text-sm text-muted">Belum ada jadwal Klinik Mutu.</div>}
    </section>
  </div>;
}
