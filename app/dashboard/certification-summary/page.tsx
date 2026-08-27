import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CertificationSummaryDashboard } from "@/components/dashboard/executive/CertificationSummaryDashboard";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getCertificationSummaryData } from "@/features/executive-dashboard/certification-summary.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Ringkasan Sertifikasi" };

export default async function CertificationSummaryPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  try { assertExecutiveAccess(user); } catch { redirect("/dashboard"); }
  return <CertificationSummaryDashboard data={await getCertificationSummaryData()} />;
}
