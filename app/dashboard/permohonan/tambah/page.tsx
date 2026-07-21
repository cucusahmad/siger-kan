import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationWizard } from "@/components/dashboard/testing-applications/ApplicationWizard";
import { getCurrentUser } from "@/lib/business/get-current-business";
export const metadata: Metadata = { title: "Permohonan Baru" };
export default async function NewApplicationPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); if (!user.roleCodes.includes("PELAKU_USAHA")) redirect("/dashboard"); return <ApplicationWizard/>; }

