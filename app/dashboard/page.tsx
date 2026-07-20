import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Handshake,
  Megaphone,
  MessageSquareHeart,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminDashboard } from "@/components/dashboard/admin/AdminDashboard";
import { isAdminDinas } from "@/features/admin-dinas/admin-dinas-auth";
import { getAdminDashboardData } from "@/features/admin-dinas/admin-dinas.service";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Ringkasan" };

const summaries = [
  { label: "Status Profil Usaha", value: "Belum lengkap", detail: "Lengkapi informasi dasar usaha", icon: BriefcaseBusiness, tone: "text-ocean bg-seafoam" },
  { label: "Permohonan Pengujian", value: "Belum ada", detail: "Belum ada permohonan pengujian", icon: Beaker, tone: "text-[#8A6411] bg-[#FFF7E2]" },
  { label: "Sertifikasi Aktif", value: "Belum ada", detail: "Belum ada sertifikasi aktif", icon: ClipboardCheck, tone: "text-[#2E9F6B] bg-[#EAF7F0]" },
  { label: "Konsultasi Mutu", value: "Belum ada", detail: "Belum ada sesi konsultasi", icon: MessageSquareHeart, tone: "text-[#7256A8] bg-[#F4F0FB]" },
  { label: "Business Matching", value: "Belum aktif", detail: "Peluang kemitraan akan tampil di sini", icon: Handshake, tone: "text-[#B64A55] bg-[#FFF0F2]" },
] as const;

const quickLinks = [
  { label: "Lengkapi profil usaha", href: "/dashboard/business", icon: BriefcaseBusiness },
  { label: "Lihat legalitas usaha", href: "/dashboard/business/legal-documents", icon: FileWarning },
  { label: "Ajukan pengujian mutu", href: "/dashboard/quality-testing", icon: Beaker },
  { label: "Buka klinik mutu", href: "/dashboard/quality-clinic", icon: MessageSquareHeart },
] as const;

export default async function DashboardPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");

  if (isAdminDinas(user)) {
    const data = await getAdminDashboardData();
    return <AdminDashboard adminName={user.fullName} data={data} />;
  }

  return (
    <div>
      <DashboardPageHeader
        eyebrow="Ringkasan layanan"
        title={`Selamat datang, ${user.fullName}`}
        description="Pantau layanan mutu, legalitas, sertifikasi, dan perkembangan usaha Anda melalui satu dashboard terintegrasi."
      />

      <section aria-labelledby="service-summary-title" className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 id="service-summary-title" className="text-lg font-bold text-navy">Ringkasan Layanan</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">Data belum tersedia</span></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaries.map((item) => <article key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(7,59,76,.045)]"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span><p className="mt-5 text-xs font-semibold text-muted">{item.label}</p><p className="mt-1 text-lg font-bold text-navy">{item.value}</p><p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p></article>)}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section aria-labelledby="business-progress-title" className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(7,59,76,.045)] sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 id="business-progress-title" className="text-lg font-bold text-navy">Progres Kelengkapan Usaha</h2><p className="mt-1 text-sm text-muted">Lengkapi data utama agar layanan dapat digunakan secara optimal.</p></div><span className="text-2xl font-bold text-ocean">0%</span></div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Kelengkapan usaha" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}><div className="h-full w-0 rounded-full bg-ocean" /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><FileWarning className="h-5 w-5 shrink-0 text-gold" /><div><p className="text-sm font-bold text-navy">Dokumen legalitas</p><p className="text-xs text-muted">Dokumen legalitas belum lengkap.</p></div></div><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-slate-400" /><div><p className="text-sm font-bold text-navy">Profil dan komoditas</p><p className="text-xs text-muted">Informasi belum dilengkapi.</p></div></div></div>
          <Link href="/dashboard/business" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white transition hover:bg-ocean focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean">Lengkapi profil usaha <ArrowRight className="h-4 w-4" /></Link>
        </section>

        <section aria-labelledby="recent-activity-title" className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(7,59,76,.045)] sm:p-7">
          <h2 id="recent-activity-title" className="text-lg font-bold text-navy">Aktivitas Terbaru</h2>
          <div className="flex min-h-48 flex-col items-center justify-center text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ClipboardCheck className="h-5 w-5" /></span><p className="mt-4 text-sm font-bold text-navy">Belum ada aktivitas terbaru</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted">Riwayat permohonan dan pembaruan layanan akan ditampilkan di bagian ini.</p></div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section aria-labelledby="quick-access-title"><h2 id="quick-access-title" className="mb-4 text-lg font-bold text-navy">Akses Cepat</h2><div className="grid gap-3 sm:grid-cols-2">{quickLinks.map((item) => <Link key={item.href} href={item.href} className="group flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-ocean/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ocean"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-seafoam text-ocean"><item.icon className="h-5 w-5" /></span><span className="text-sm font-bold text-navy">{item.label}</span><ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-ocean" /></Link>)}</div></section>
        <section aria-labelledby="announcement-title"><h2 id="announcement-title" className="mb-4 text-lg font-bold text-navy">Informasi dan Pengumuman</h2><div className="rounded-3xl bg-navy p-6 text-white shadow-[0_16px_45px_rgba(7,59,76,.15)]"><Megaphone className="h-6 w-6 text-aqua" /><h3 className="mt-5 font-bold">Pusat informasi SIGER-KAN</h3><p className="mt-2 text-sm leading-6 text-white/65">Pengumuman layanan, jadwal, dan informasi mutu perikanan akan tersedia di sini.</p><span className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-aqua">Segera hadir</span></div></section>
      </div>
    </div>
  );
}
