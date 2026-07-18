import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { BusinessProfilePage } from "@/components/dashboard/business/business-profile-page";
import { getBusinessProfileData } from "@/lib/business/business-profile-service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Profil Usaha" };

export default async function BusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.permissions.includes("business.read")) return <section className="rounded-3xl border border-[#E63946]/20 bg-white p-8 text-center"><h1 className="text-xl font-bold text-navy">Akses tidak tersedia</h1><p className="mt-2 text-sm text-muted">Akun Anda tidak memiliki izin untuk melihat profil usaha.</p></section>;
  const data = await getBusinessProfileData(user.id, user.permissions.includes("business.update"));
  if (!data) return <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white p-8 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-seafoam text-ocean"><Building2 className="h-7 w-7" /></span><h1 className="mt-5 text-xl font-bold text-navy">Belum ada usaha terhubung</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted">Akun Anda belum memiliki membership usaha aktif. Hubungi pengelola usaha atau daftarkan akun pelaku usaha melalui jalur resmi.</p><Link href="/dashboard" className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Kembali ke Dashboard</Link></section>;
  return <BusinessProfilePage initialData={data} />;
}
