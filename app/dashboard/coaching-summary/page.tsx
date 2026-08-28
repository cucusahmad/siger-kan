import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CoachingSummaryDashboard } from "@/components/dashboard/executive/CoachingSummaryDashboard";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { getCoachingSummaryData } from "@/features/executive-dashboard/coaching-summary.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Ringkasan Pembinaan" };
export default async function CoachingSummaryPage() { const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value; const user = token ? await getAuthenticatedUser(token) : null; if (!user) redirect("/login"); try { assertExecutiveAccess(user); } catch { redirect("/dashboard"); } return <CoachingSummaryDashboard data={await getCoachingSummaryData()} />; }
