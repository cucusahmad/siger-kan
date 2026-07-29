import type { AuthenticatedUser } from "@/features/auth/auth.types";

const executiveRoles = ["KEPALA_DINAS", "KEPALA_UPTD"] as const;

export function isExecutiveUser(user: AuthenticatedUser): boolean {
  return executiveRoles.some((role) => user.roleCodes.includes(role));
}

export function assertExecutiveAccess(user: AuthenticatedUser): void {
  if (!isExecutiveUser(user) || !user.permissions.includes("report.read")) {
    throw new Error("FORBIDDEN");
  }
}
