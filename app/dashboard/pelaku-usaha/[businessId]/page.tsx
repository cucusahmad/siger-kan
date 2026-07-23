import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminBusinessDetail } from "@/components/dashboard/admin/AdminBusinessDetail";
import { isAdminDinas, requireBusinessActorReader } from "@/features/admin-dinas/admin-dinas-auth";
import { getAdminBusinessDetail } from "@/features/admin-dinas/admin-dinas.service";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Detail Pelaku Usaha" };

export default async function BusinessActorDetailPage({ params }: Readonly<{ params: Promise<{ businessId: string }> }>) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");
  requireBusinessActorReader(user);
  const business = await getAdminBusinessDetail((await params).businessId);
  if (!business) notFound();
  return <AdminBusinessDetail business={business} canManage={isAdminDinas(user)} />;
}
