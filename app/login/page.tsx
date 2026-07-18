import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LoginCard } from "@/components/login/login-card";
import { LoginIllustration } from "@/components/login/login-illustration";

export const metadata: Metadata = {
  title: "Masuk | SIGER-KAN",
  description: "Masuk ke platform layanan mutu dan perikanan SIGER-KAN.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f9f8] lg:grid lg:grid-cols-[minmax(420px,.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-navy px-8 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="soft-grid absolute inset-0 opacity-[.08]" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        <Link href="/" className="relative z-10 flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-aqua" aria-label="Kembali ke beranda SIGER-KAN">
          <span className="rounded-xl bg-white p-1.5"><Image src="/siger-kan-mark.svg" alt="" width={36} height={36} priority /></span>
          <span><strong className="block text-lg leading-none">SIGER-KAN</strong><small className="mt-1 block text-[9px] font-semibold uppercase tracking-[.14em] text-aqua">Gerai Mutu dan Perikanan</small></span>
        </Link>
        <div className="relative z-10 py-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-aqua">Layanan dalam satu akses</p>
          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-[-.04em] xl:text-[2.65rem]">Kualitas perikanan dimulai dari layanan yang tepercaya.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/62">Akses layanan pengujian, sertifikasi, konsultasi mutu, dan kemitraan usaha secara aman.</p>
          <div className="mt-10"><LoginIllustration /></div>
        </div>
        <p className="relative z-10 text-[11px] text-white/45">Layanan digital perikanan Provinsi Lampung</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="soft-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-aqua/10 blur-3xl" />
        <div className="relative w-full max-w-[520px]">
          <Link href="/" className="mb-5 flex w-fit items-center gap-2.5 lg:hidden" aria-label="Kembali ke beranda SIGER-KAN"><Image src="/siger-kan-mark.svg" alt="" width={38} height={38} priority /><strong className="text-base text-navy">SIGER-KAN</strong></Link>
          <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_28px_80px_rgba(7,59,76,.11)] sm:rounded-[2.25rem]"><LoginCard /></div>
          <p className="mt-5 text-center text-[11px] text-muted">Kredensial Anda diproses melalui koneksi yang aman.</p>
        </div>
      </section>
    </main>
  );
}
