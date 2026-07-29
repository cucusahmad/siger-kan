import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/features/auth/auth.types";
import { getCurrentUser } from "@/lib/business/get-current-business";

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roleCodes.includes("SUPER_ADMIN");
}

export function requireSuperAdminPage(user: AuthenticatedUser): void {
  if (!isSuperAdmin(user)) redirect("/dashboard");
}

export async function requireSuperAdminApi(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!isSuperAdmin(user)) throw new Error("FORBIDDEN");
  return user;
}
