import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ExecutiveDetailReport } from "@/components/dashboard/executive/ExecutiveDetailReport";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Laporan Lengkap Business Match" };

export default async function BusinessMatchReportPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  try { assertExecutiveAccess(user); } catch { redirect("/dashboard"); }
  const data = await getExecutiveDashboardData();
  return <ExecutiveDetailReport kind="matching" generatedAt={data.generatedAt} rows={data.matches} />;
}
