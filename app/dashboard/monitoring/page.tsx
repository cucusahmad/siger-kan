import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MonitoringEvaluationDashboard } from "@/components/dashboard/executive/MonitoringEvaluationDashboard";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { isExecutiveUser } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getCertificationSummaryData } from "@/features/executive-dashboard/certification-summary.service";
import { getExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Monitoring dan Evaluasi" };

export default async function MonitoringPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  if (!isExecutiveUser(user)) redirect("/dashboard");

  const [data, certificationData] = await Promise.all([
    getExecutiveDashboardData(),
    getCertificationSummaryData(),
  ]);

  return <MonitoringEvaluationDashboard data={data} certificationData={certificationData} />;
}
