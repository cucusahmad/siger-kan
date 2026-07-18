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
const termsVersion = "1.0";
const privacyVersion = "1.0";

const businessTypeCodes = {
  Pembudidaya: "FISH_FARMER",
  Nelayan: "FISHER",
  Pengolah: "PROCESSOR",
  Distributor: "DISTRIBUTOR",
  Eksportir: "EXPORTER",
  UMKM: "MSME",
  Lainnya: "OTHER",
} as const;

const commodityCodes = {
  Udang: "UDANG",
  Tuna: "TUNA",
  Cakalang: "CAKALANG",
  Bandeng: "BANDENG",
  "Rumput Laut": "RUMPUT_LAUT",
  Kepiting: "KEPITING",
  Lobster: "LOBSTER",
  Lainnya: "LAINNYA",
} as const;

interface RegistrationApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

export function RegistrationCard() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, setError, resetField, formState: { errors, isSubmitting } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "", businessName: "", province: "Lampung", terms: false },
    mode: "onTouched",
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          passwordConfirmation: values.confirmPassword,
          businessName: values.businessName,
          businessType: businessTypeCodes[values.businessType],
          businessTypeOther: values.businessTypeOther || null,
          commodityId: commodityCodes[values.commodity],
          commodityOther: values.commodityOther || null,
          cityRegency: values.region,
          province: values.province,
          termsAccepted: values.terms,
          termsVersion,
          privacyVersion,
        }),
      });
      const result = await response.json() as RegistrationApiResponse;

      if (!response.ok) {
        const frontendFieldByApiField: Readonly<Record<string, keyof RegistrationFormValues>> = {
          passwordConfirmation: "confirmPassword",
          commodityId: "commodity",
          cityRegency: "region",
          termsAccepted: "terms",
        };

        for (const [field, messages] of Object.entries(result.errors ?? {})) {
          const formField = frontendFieldByApiField[field]
            ?? (field as keyof RegistrationFormValues);
          const message = messages[0];

          if (message && formField in values) {
            setError(formField, { type: "server", message });
          }
        }

        setServerError(result.message || "Pendaftaran belum dapat diproses.");
        resetField("password");
        resetField("confirmPassword");
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Terjadi kesalahan pada server. Silakan coba kembali.");
      resetField("password");
      resetField("confirmPassword");
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[580px] flex-col items-center justify-center px-6 py-14 text-center sm:px-12" role="status" aria-live="polite">
        <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#EAF8F1] text-[#2E9F6B]"><span className="absolute inset-0 animate-ping rounded-[1.75rem] bg-[#2E9F6B]/10" /><CheckCircle2 className="relative h-9 w-9" /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-ocean">Pendaftaran berhasil</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-.035em] text-navy">Pendaftaran berhasil.</h1>
        <p className="mt-4 max-w-md whitespace-pre-line text-base leading-7 text-muted">Silakan periksa email Anda untuk melakukan verifikasi akun. Data usaha Anda akan ditinjau oleh petugas SIGER-KAN.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="flex min-h-12 items-center rounded-full border border-navy/12 bg-white px-6 text-sm font-bold text-navy transition hover:border-ocean/40 hover:bg-seafoam/40 focus-visible:outline-2 focus-visible:outline-ocean">Kembali ke Beranda</Link>
          <Link href="/login" className="flex min-h-12 items-center rounded-full bg-navy px-6 text-sm font-bold text-white transition hover:bg-ocean focus-visible:outline-2 focus-visible:outline-ocean">Ke Halaman Masuk</Link>
        </div>
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
        <BusinessSection errors={errors} register={register} watch={watch} />

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-navy/8 bg-slate-50/70 p-4 transition hover:border-ocean/25">
            <input type="checkbox" {...register("terms")} className="peer sr-only" />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-navy/20 bg-white text-transparent transition peer-checked:border-ocean peer-checked:bg-ocean peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ocean/30"><Check className="h-3.5 w-3.5" /></span>
            <span className="text-xs leading-5 text-muted">Saya menyetujui <Link href="#" className="font-bold text-ocean underline decoration-ocean/25 underline-offset-2">Syarat &amp; Ketentuan</Link> serta <Link href="#" className="font-bold text-ocean underline decoration-ocean/25 underline-offset-2">Kebijakan Privasi</Link>.</span>
          </label>
          {errors.terms && <p className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{errors.terms.message}</p>}
        </div>

        {serverError && <p role="alert" className="rounded-2xl border border-[#E63946]/20 bg-[#FFF4F5] px-4 py-3 text-sm font-medium text-[#C72F3B]">{serverError}</p>}

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
