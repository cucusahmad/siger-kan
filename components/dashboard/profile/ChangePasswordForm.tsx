"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { changePasswordSchema, type ChangePasswordInput } from "@/features/account/account.schema";

interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly errors?: Partial<Record<keyof ChangePasswordInput, readonly string[]>>;
}

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-700 outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/10";

export function ChangePasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ readonly success: boolean; readonly message: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(input: ChangePasswordInput): Promise<void> {
    setFeedback(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.success) {
        if (result.errors) {
          for (const [field, messages] of Object.entries(result.errors)) {
            const message = messages?.[0];
            if (message) setError(field as keyof ChangePasswordInput, { message });
          }
        }
        setFeedback({ success: false, message: result.message });
        return;
      }
      reset();
      setFeedback({ success: true, message: result.message });
    } catch {
      setFeedback({ success: false, message: "Koneksi bermasalah. Silakan coba kembali." });
    }
  }

  return (
    <section aria-labelledby="password-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><KeyRound className="h-5 w-5" /></span>
        <div><h2 id="password-title" className="text-lg font-bold text-navy">Ubah Password</h2><p className="mt-1 text-sm leading-6 text-muted">Gunakan kombinasi huruf besar, huruf kecil, dan angka untuk menjaga keamanan akun.</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <PasswordField label="Password saat ini" error={errors.currentPassword?.message} show={showPassword} registration={register("currentPassword")} />
        <PasswordField label="Password baru" error={errors.newPassword?.message} show={showPassword} registration={register("newPassword")} />
        <PasswordField label="Konfirmasi password baru" error={errors.confirmPassword?.message} show={showPassword} registration={register("confirmPassword")} />
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-ocean" /> Tampilkan password</label>
        {feedback && <p role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${feedback.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-danger"}`}>{feedback.success && <CheckCircle2 className="h-4 w-4" />}{feedback.message}</p>}
        <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ocean px-5 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Simpan Password Baru</button>
      </form>
    </section>
  );
}

interface PasswordFieldProps {
  readonly label: string;
  readonly error?: string;
  readonly show: boolean;
  readonly registration: ReturnType<ReturnType<typeof useForm<ChangePasswordInput>>["register"]>;
}

function PasswordField({ label, error, show, registration }: PasswordFieldProps) {
  const Icon = show ? EyeOff : Eye;
  return <label className="block text-sm font-semibold text-ink">{label}<span className="relative block"><input type={show ? "text" : "password"} autoComplete={label === "Password saat ini" ? "current-password" : "new-password"} aria-invalid={Boolean(error)} className={inputClass} {...registration} /><Icon aria-hidden="true" className="pointer-events-none absolute right-3.5 top-5 h-4 w-4 text-slate-400" /></span>{error && <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>}</label>;
}
