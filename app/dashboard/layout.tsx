import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getVisibleNavigation } from "@/components/dashboard/dashboard-navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = {
  title: { default: "Dashboard | SIGER-KAN", template: "%s | SIGER-KAN" },
  description: "Ruang kerja layanan mutu dan perikanan terintegrasi SIGER-KAN.",
};

function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) ?? "SK").toUpperCase();
}

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;
  if (!user) redirect("/login");

  const navigation = getVisibleNavigation({
    roleCodes: user.roleCodes,
    permissions: user.permissions,
    hasBusinessMembership: user.hasBusinessMembership,
  });

  return (
    <DashboardShell
      navigation={navigation}
      user={{
        fullName: user.fullName,
        primaryRole: user.roles[0] ?? "Pengguna SIGER-KAN",
        businessName: user.businessName,
        initials: getInitials(user.fullName),
      }}
    >
      {children}
    </DashboardShell>
  );
}
