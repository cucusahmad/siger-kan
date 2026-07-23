import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/features/auth/auth.types";

const adminRoles = new Set(["ADMIN_DINAS", "SUPER_ADMIN"]);
const businessReaderRoles = new Set(["ADMIN_DINAS", "KEPALA_UPTD", "SUPER_ADMIN"]);

export function isAdminDinas(user: AuthenticatedUser): boolean {
  return user.roleCodes.some((role) => adminRoles.has(role));
}

export function requireAdminDinas(user: AuthenticatedUser): void {
  if (!isAdminDinas(user)) redirect("/dashboard");
}

export function canReadBusinessActors(user: AuthenticatedUser): boolean {
  return user.roleCodes.some((role) => businessReaderRoles.has(role));
}

export function requireBusinessActorReader(user: AuthenticatedUser): void {
  if (!canReadBusinessActors(user)) redirect("/dashboard");
}
