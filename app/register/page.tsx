import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegistrationIllustration } from "@/components/register/illustration";
import { RegistrationCard } from "@/components/register/registration-card";

export const metadata: Metadata = {
  title: "Daftar Pelaku Usaha | SIGER-KAN",
  description: "Daftarkan usaha perikanan Anda untuk mengakses ekosistem layanan mutu SIGER-KAN.",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f9f8] lg:grid lg:grid-cols-[minmax(420px,.82fr)_minmax(620px,1.18fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-navy px-8 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="soft-grid absolute inset-0 opacity-[.08]" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-aqua/12 blur-3xl" />
        <Link href="/" className="relative z-10 flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-aqua" aria-label="Kembali ke beranda SIGER-KAN">
          <span className="rounded-xl bg-white p-1.5"><Image src="/siger-kan-mark.svg" alt="" width={36} height={36} priority /></span>
          <span><strong className="block text-lg leading-none">SIGER-KAN</strong><small className="mt-1 block text-[9px] font-semibold uppercase tracking-[.14em] text-aqua">Gerai Mutu dan Perikanan</small></span>
        </Link>
        <div className="relative z-10 py-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-aqua">Satu akun, seluruh layanan</p>
          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-[-.04em] xl:text-[2.65rem]">Usaha perikanan yang tumbuh bersama standar mutu.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/62">Hubungkan usaha, laboratorium, sertifikasi, dan peluang pasar dalam ekosistem digital yang tepercaya.</p>
          <div className="mt-9"><RegistrationIllustration /></div>
        </div>
        <p className="relative z-10 text-[11px] text-white/45">Layanan digital perikanan Provinsi Lampung</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10 xl:px-16">
        <div className="soft-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-aqua/10 blur-3xl" />
        <div className="relative w-full max-w-[720px]">
          <Link href="/" className="mb-5 flex w-fit items-center gap-2.5 lg:hidden" aria-label="Kembali ke beranda SIGER-KAN"><Image src="/siger-kan-mark.svg" alt="" width={38} height={38} priority /><strong className="text-base text-navy">SIGER-KAN</strong></Link>
          <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_28px_80px_rgba(7,59,76,.11)] sm:rounded-[2.25rem]">
            <RegistrationCard />
          </div>
          <p className="mt-5 text-center text-[11px] text-muted">Data Anda dilindungi dan hanya digunakan untuk kebutuhan layanan SIGER-KAN.</p>
        </div>
      </section>
    </main>
  );
}
