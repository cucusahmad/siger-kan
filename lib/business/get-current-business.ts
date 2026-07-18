import { cookies } from "next/headers";

import { BusinessMembershipRole, BusinessMembershipStatus } from "@/app/generated/prisma/client";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  return token ? getAuthenticatedUser(token) : null;
}

export async function resolveCurrentBusiness(userId: string) {
  return prisma.businessMember.findFirst({
    where: {
      userId: BigInt(userId), status: BusinessMembershipStatus.ACTIVE, deletedAt: null,
      business: { deletedAt: null },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { id: "asc" }],
    select: { businessId: true, role: true, business: { select: { id: true, name: true, status: true, updatedAt: true } } },
  });
}

export const editableBusinessRoles = new Set<BusinessMembershipRole>([
  BusinessMembershipRole.OWNER, BusinessMembershipRole.ADMIN, BusinessMembershipRole.QUALITY_MANAGER,
]);
