import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PastCertificationsPage } from "@/components/dashboard/certification/PastCertificationsPage";
import { listPastCertifications } from "@/features/past-certifications/past-certification.service";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";

export const metadata: Metadata = { title: "Daftar Sertifikasi Lampau" };

export default async function CertificationHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await resolveCurrentBusiness(user.id);
  if (!user.roleCodes.includes("PELAKU_USAHA") || !membership) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-[#073B4C]">Akses tidak tersedia</h1>
        <p className="mt-2 text-sm text-slate-500">Daftar sertifikasi lampau tersedia bagi pelaku usaha.</p>
      </div>
    );
  }

  const records = await listPastCertifications(user.id);
  return <PastCertificationsPage initialRecords={records} canManage={user.permissions.includes("certification.create")} />;
}
