"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
  rememberMe: z.boolean(),
});

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

const inputClassName = "min-h-14 w-full rounded-2xl border border-navy/12 bg-slate-50/70 px-4 pt-5 pb-1.5 text-sm font-semibold text-navy outline-none transition placeholder:text-transparent focus:border-ocean focus:bg-white focus:ring-4 focus:ring-ocean/8";

export function LoginCard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as LoginApiResponse;

      if (!response.ok) {
        for (const field of ["email", "password"] as const) {
          const message = result.errors?.[field]?.[0];
          if (message) setError(field, { type: "server", message });
        }
        setServerError(result.message || "Login belum dapat diproses.");
        resetField("password");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setServerError("Terjadi kesalahan pada server. Silakan coba kembali.");
      resetField("password");
    }
  };

  return (
    <div className="p-6 sm:p-9 lg:p-10">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-seafoam/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-ocean"><LockKeyhole className="h-3.5 w-3.5" /> Akses Aman</div>
        <h1 className="text-3xl font-bold tracking-[-.04em] text-navy sm:text-[2.15rem]">Masuk ke SIGER-KAN</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Gunakan akun Anda untuk mengakses layanan mutu dan perikanan terintegrasi.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label className="relative block">
            <input type="email" autoComplete="email" placeholder="Email" {...register("email")} className={inputClassName} />
            <span className="pointer-events-none absolute left-4 top-2.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted">Email</span>
          </label>
          {errors.email && <p className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{errors.email.message}</p>}
        </div>
        <div>
          <label className="relative block">
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" {...register("password")} className={`${inputClassName} pr-14`} />
            <span className="pointer-events-none absolute left-4 top-2.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted">Password</span>
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-seafoam hover:text-ocean focus-visible:outline-2 focus-visible:outline-ocean">
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </label>
          {errors.password && <p className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{errors.password.message}</p>}
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-muted">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-navy/20 accent-[#087E8B]" />
          Ingat saya
        </label>

        {serverError && <p role="alert" aria-live="polite" className="rounded-2xl border border-[#E63946]/20 bg-[#FFF4F5] px-4 py-3 text-sm font-medium text-[#C72F3B]">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-navy px-6 text-sm font-bold text-white shadow-lg shadow-navy/20 transition hover:-translate-y-0.5 hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean">
          {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />} {isSubmitting ? "Memproses..." : "Masuk"}
        </button>
        <p className="text-center text-sm text-muted">Belum punya akun? <Link href="/register" className="font-bold text-ocean transition hover:text-navy">Daftar</Link></p>
      </form>
    </div>
  );
}
