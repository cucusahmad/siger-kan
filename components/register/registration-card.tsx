"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AccountSection } from "./account-section";
import { BusinessSection } from "./business-section";
import { registrationSchema, type RegistrationFormValues } from "./registration-schema";

const benefits = ["Pengajuan layanan online", "Tracking proses laboratorium", "Sertifikat digital", "Pendampingan mutu"] as const;

export function RegistrationCard() {
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "", businessName: "", province: "Lampung", terms: false },
    mode: "onTouched",
  });

  const onSubmit = () => {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="flex min-h-[580px] flex-col items-center justify-center px-6 py-14 text-center sm:px-12" role="status" aria-live="polite">
        <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#EAF8F1] text-[#2E9F6B]"><span className="absolute inset-0 animate-ping rounded-[1.75rem] bg-[#2E9F6B]/10" /><CheckCircle2 className="relative h-9 w-9" /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-ocean">Data siap diproses</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.035em] text-navy">Pendaftaran berhasil disiapkan.</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted">Integrasi backend akan dilakukan pada Sprint berikutnya.</p>
        <button type="button" onClick={() => setSubmitted(false)} className="mt-8 min-h-12 rounded-full border border-navy/12 bg-white px-6 text-sm font-bold text-navy transition hover:border-ocean/40 hover:bg-seafoam/40 focus-visible:outline-2 focus-visible:outline-ocean">Kembali ke formulir</button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8 lg:p-10">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-seafoam/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-ocean"><ShieldCheck className="h-3.5 w-3.5" /> Registrasi Pelaku Usaha</div>
        <h1 className="text-3xl font-bold tracking-[-.04em] text-navy sm:text-[2.15rem]">Daftarkan Usaha Anda</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Mulai akses layanan pengujian mutu, sertifikasi, konsultasi, AI Knowledge Base, dan Business Matching melalui SIGER-KAN.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        <AccountSection errors={errors} register={register} watch={watch} showPassword={showPassword} showConfirmPassword={showConfirmPassword} togglePassword={() => setShowPassword((value) => !value)} toggleConfirmPassword={() => setShowConfirmPassword((value) => !value)} />
        <div className="h-px bg-navy/8" />
        <BusinessSection errors={errors} register={register} />

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-navy/8 bg-slate-50/70 p-4 transition hover:border-ocean/25">
            <input type="checkbox" {...register("terms")} className="peer sr-only" />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-navy/20 bg-white text-transparent transition peer-checked:border-ocean peer-checked:bg-ocean peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ocean/30"><Check className="h-3.5 w-3.5" /></span>
            <span className="text-xs leading-5 text-muted">Saya menyetujui <Link href="#" className="font-bold text-ocean underline decoration-ocean/25 underline-offset-2">Syarat &amp; Ketentuan</Link> serta <Link href="#" className="font-bold text-ocean underline decoration-ocean/25 underline-offset-2">Kebijakan Privasi</Link>.</span>
          </label>
          {errors.terms && <p className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{errors.terms.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy px-6 text-sm font-bold text-white shadow-lg shadow-navy/20 transition hover:-translate-y-0.5 hover:bg-ocean hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean">
          {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Daftar Sekarang
        </button>
        <p className="text-center text-sm text-muted">Sudah memiliki akun? <Link href="/login" className="font-bold text-ocean transition hover:text-navy">Masuk</Link></p>
      </form>

      <div className="mt-8 border-t border-navy/8 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-muted">Dengan satu akun Anda mendapatkan</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2.5 text-xs font-semibold text-navy/80"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF8F1] text-[#2E9F6B]"><Check className="h-3 w-3" /></span>{benefit}</li>)}
        </ul>
      </div>
    </div>
  );
}
