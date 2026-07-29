import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TestingSummaryDashboard } from "@/components/dashboard/executive/TestingSummaryDashboard";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Ringkasan Pengujian" };

export default async function TestingSummaryPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  try { assertExecutiveAccess(user); } catch { redirect("/dashboard"); }
  return <TestingSummaryDashboard data={await getExecutiveDashboardData()} />;
}
