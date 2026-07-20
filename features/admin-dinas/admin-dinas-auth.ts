import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/features/auth/auth.types";

const adminRoles = new Set(["ADMIN_DINAS", "SUPER_ADMIN"]);

export function isAdminDinas(user: AuthenticatedUser): boolean {
  return user.roleCodes.some((role) => adminRoles.has(role));
}

export function requireAdminDinas(user: AuthenticatedUser): void {
  if (!isAdminDinas(user)) redirect("/dashboard");
}
