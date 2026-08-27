import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ExecutiveReport } from "@/components/dashboard/executive/ExecutiveReport";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { assertExecutiveAccess } from "@/features/executive-dashboard/executive-dashboard.auth";
import { getCertificationSummaryData } from "@/features/executive-dashboard/certification-summary.service";
import { getExecutiveDashboardData } from "@/features/executive-dashboard/executive-dashboard.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Laporan Eksekutif" };

interface Props {
  readonly searchParams: Promise<{ readonly section?: string }>;
}

export default async function ExecutiveReportPage({ searchParams }: Props) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  try {
    assertExecutiveAccess(user);
  } catch {
    redirect("/dashboard");
  }
  const [data, certification, filters] = await Promise.all([
    getExecutiveDashboardData(),
    getCertificationSummaryData(),
    searchParams,
  ]);
  return <ExecutiveReport data={data} certificationRows={certification.rows} initialSection={filters.section ?? "businesses"} />;
}
