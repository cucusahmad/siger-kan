import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationsList } from "@/components/dashboard/testing-applications/ApplicationsList";
import { getCurrentUser } from "@/lib/business/get-current-business";
export const metadata: Metadata = { title: "Permohonan Pengujian" };
export default async function ApplicationsPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); if (!user.roleCodes.includes("PELAKU_USAHA")) return <AccessDenied/>; return <ApplicationsList/>; }
function AccessDenied() { return <div className="rounded-2xl border bg-white p-10 text-center"><h1 className="text-xl font-bold text-[#073B4C]">Akses tidak tersedia</h1><p className="mt-2 text-sm text-slate-500">Fitur ini hanya tersedia untuk Pelaku Usaha.</p></div>; }

