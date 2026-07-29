import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BusinessMatchSummaryDashboard } from "@/components/dashboard/executive/BusinessMatchSummaryDashboard";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Ringkasan Business Match" };

export default async function BusinessMatchSummaryPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  try { assertExecutiveAccess(user); } catch { redirect("/dashboard"); }
  return <BusinessMatchSummaryDashboard data={await getExecutiveDashboardData()} />;
}
