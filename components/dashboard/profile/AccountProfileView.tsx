import { Building2, Clock3, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import type { AccountProfile } from "@/features/account/account.types";

import { ChangePasswordForm } from "./ChangePasswordForm";

interface AccountProfileViewProps { readonly profile: AccountProfile; }

function formatDate(value: Date | null): string {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(value) : "Belum tercatat";
}

export function AccountProfileView({ profile }: AccountProfileViewProps) {
  const initials = profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <div className="space-y-6">
    <header className="overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-[0_18px_55px_rgba(7,59,76,.16)] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-aqua ring-1 ring-white/15">{initials || "SK"}</span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-aqua">Profil Saya</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{profile.fullName}</h1><p className="mt-2 text-sm text-white/65">{profile.positionTitle ?? profile.roles.join(", ")}</p><div className="mt-3 flex flex-wrap gap-2">{profile.roles.map((role) => <span key={role} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{role}</span>)}</div></div></div>
    </header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
      <div className="space-y-6">
        <section aria-labelledby="identity-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-ocean" /><h2 id="identity-title" className="text-lg font-bold text-navy">Informasi Pribadi</h2></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Nama lengkap" value={profile.fullName} /><Info icon={Mail} label="Email" value={profile.email} /><Info icon={Phone} label="Nomor telepon" value={profile.phone ?? "Belum dilengkapi"} /><Info label="NIP/Nomor pegawai" value={profile.employeeNumber ?? "Tidak berlaku"} /></dl></section>
        <section aria-labelledby="work-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-ocean" /><h2 id="work-title" className="text-lg font-bold text-navy">Instansi dan Peran</h2></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Jabatan" value={profile.positionTitle ?? "Belum dilengkapi"} /><Info label="Instansi" value={profile.agencyName ?? profile.businessName ?? "Belum terhubung"} /><Info label="Unit organisasi" value={profile.organizationalUnitName ?? "Belum terhubung"} /><Info icon={ShieldCheck} label="Peran akses" value={profile.roles.join(", ") || "Pengguna SIGER-KAN"} /></dl></section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-ocean" /><h2 className="text-lg font-bold text-navy">Aktivitas Keamanan</h2></div><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Login terakhir" value={formatDate(profile.lastLoginAt)} /><Info label="Password terakhir diubah" value={formatDate(profile.passwordChangedAt)} /></dl></section>
      </div>
      <ChangePasswordForm />
    </div>
  </div>;
}

interface InfoProps { readonly label: string; readonly value: string; readonly icon?: typeof Mail; }
function Info({ label, value, icon: Icon }: InfoProps) { return <div><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</dt><dd className="mt-2 break-words text-sm font-semibold text-ink">{value}</dd></div>; }
