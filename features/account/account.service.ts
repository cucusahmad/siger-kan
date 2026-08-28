import { AuditAction } from "@/app/generated/prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { ChangePasswordInput } from "./account.schema";
import type { AccountProfile } from "./account.types";

export class AccountError extends Error {
  public readonly code: "INVALID_CURRENT_PASSWORD" | "ACCOUNT_NOT_FOUND";

  constructor(code: AccountError["code"]) {
    super(code);
    this.name = "AccountError";
    this.code = code;
  }
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const user = await prisma.user.findFirst({
    where: { id: BigInt(userId), deletedAt: null },
    select: {
      email: true,
      phone: true,
      lastLoginAt: true,
      passwordChangedAt: true,
      profile: {
        select: {
          fullName: true,
          employeeNumber: true,
          positionTitle: true,
          agency: { select: { name: true } },
          organizationalUnit: { select: { name: true } },
        },
      },
      roles: {
        where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { role: { select: { name: true } } },
      },
      businessMemberships: {
        where: { deletedAt: null, status: "ACTIVE" },
        take: 1,
        select: { business: { select: { name: true } } },
      },
    },
  });

  if (!user) return null;
  return {
    fullName: user.profile?.fullName ?? user.email,
    email: user.email,
    phone: user.phone,
    employeeNumber: user.profile?.employeeNumber ?? null,
    positionTitle: user.profile?.positionTitle ?? null,
    agencyName: user.profile?.agency?.name ?? null,
    organizationalUnitName: user.profile?.organizationalUnit?.name ?? null,
    roles: user.roles.map(({ role }) => role.name),
    businessName: user.businessMemberships[0]?.business.name ?? null,
    lastLoginAt: user.lastLoginAt,
    passwordChangedAt: user.passwordChangedAt,
  };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  context: RequestContext,
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: BigInt(userId), deletedAt: null },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new AccountError("ACCOUNT_NOT_FOUND");
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new AccountError("INVALID_CURRENT_PASSWORD");
  }

  const passwordHash = await hashPassword(input.newPassword);
  const changedAt = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordChangedAt: changedAt },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: AuditAction.PASSWORD_CHANGE,
        entityType: "USER_ACCOUNT",
        entityId: user.id.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { event: "PASSWORD_CHANGED" },
      },
    }),
  ]);
}
