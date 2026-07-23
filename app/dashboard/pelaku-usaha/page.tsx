import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin/AdminDashboard";
import { requireBusinessActorReader } from "@/features/admin-dinas/admin-dinas-auth";
import { getAdminDashboardData } from "@/features/admin-dinas/admin-dinas.service";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Data Pelaku Usaha" };

export default async function BusinessActorsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  requireBusinessActorReader(user);
  const data = await getAdminDashboardData();
  return <AdminDashboard adminName={user.fullName} data={data} />;
}
