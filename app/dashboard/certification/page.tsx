import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CertificationWorkspace } from "@/components/dashboard/certification/CertificationWorkspace";
import { getApplicantSnapshot } from "@/features/certification-applications/certification-application.service";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";
export const metadata: Metadata = { title: "Permohonan Sertifikasi" };
export default async function CertificationPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); const isReviewer = user.roleCodes.includes("PETUGAS_SERTIFIKASI"); if (isReviewer) return <CertificationWorkspace isReviewer/>; const membership = await resolveCurrentBusiness(user.id); if (!user.roleCodes.includes("PELAKU_USAHA") || !membership) return <div className="rounded-2xl border bg-white p-10 text-center"><h1 className="text-xl font-bold text-[#073B4C]">Akses tidak tersedia</h1><p className="mt-2 text-sm text-slate-500">Fitur ini tersedia bagi pelaku usaha dan petugas sertifikasi.</p></div>; const applicantSnapshot = await getApplicantSnapshot({ userId: user.id, businessId: membership.businessId }); return <CertificationWorkspace isReviewer={false} applicantSnapshot={applicantSnapshot} initialView="application"/>; }
