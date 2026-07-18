import {
  AuditAction,
  BusinessMembershipStatus,
  BusinessStatus,
  SessionStatus,
  UserStatus,
  UserType,
} from "@/app/generated/prisma/client";
import { createAccessToken, createOpaqueToken, hashToken, verifyAccessToken } from "@/lib/auth-token";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { LoginInput } from "./login.schema";
import type { AuthenticatedUser, LoginResult } from "./auth.types";
import { AuthenticationError } from "./auth.types";

const INVALID_CREDENTIALS = "Email atau password salah.";

async function recordFailedLogin(
  userId: bigint | null,
  context: RequestContext,
  reason: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: AuditAction.LOGIN_FAILED,
      entityType: "AUTHENTICATION",
      entityId: userId?.toString(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason },
    },
  });
}

export async function login(
  input: LoginInput,
  context: RequestContext,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { normalizedEmail: input.email },
    include: {
      businessMemberships: {
        where: { deletedAt: null, status: BusinessMembershipStatus.ACTIVE },
        include: { business: true },
      },
    },
  });

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    await recordFailedLogin(user?.id ?? null, context, "INVALID_CREDENTIALS");
    throw new AuthenticationError(INVALID_CREDENTIALS);
  }

  const now = new Date();
  let rejection: string | null = null;
  let reason = "";

  if (user.deletedAt) {
    rejection = "Akun Anda telah dihapus. Hubungi administrator.";
    reason = "DELETED";
  } else if (user.lockedUntil && user.lockedUntil > now) {
    rejection = "Akun Anda sedang diblokir. Hubungi administrator.";
    reason = "BLOCKED";
  } else if (user.status === UserStatus.SUSPENDED) {
    rejection = "Akun Anda sedang diblokir. Hubungi administrator.";
    reason = "SUSPENDED";
  } else if (user.status === UserStatus.DISABLED) {
    rejection = "Akun Anda tidak aktif. Hubungi administrator.";
    reason = "INACTIVE";
  } else if (!user.emailVerifiedAt || user.status === UserStatus.PENDING_VERIFICATION) {
    rejection = "Email Anda belum diverifikasi.";
    reason = "EMAIL_NOT_VERIFIED";
  } else if (user.status !== UserStatus.ACTIVE) {
    rejection = "Akun Anda tidak dapat digunakan. Hubungi administrator.";
    reason = "INVALID_STATUS";
  }

  if (!rejection && user.type === UserType.EXTERNAL_BUSINESS) {
    const hasInactiveBusiness = user.businessMemberships.some(
      ({ business }) => business.deletedAt !== null || business.status === BusinessStatus.INACTIVE,
    );

    if (hasInactiveBusiness) {
      rejection = "Usaha Anda tidak aktif. Hubungi administrator.";
      reason = "BUSINESS_INACTIVE";
    }
  }

  if (rejection) {
    await recordFailedLogin(user.id, context, reason);
    throw new AuthenticationError(rejection);
  }

  const refreshToken = createOpaqueToken();
  const tokenFamily = createOpaqueToken();
  const placeholderAccessHash = hashToken(createOpaqueToken());
  const provisionalExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (transaction) => {
    const session = await transaction.userSession.create({
      data: {
        userId: user.id,
        accessTokenHash: placeholderAccessHash,
        refreshTokenHash: hashToken(refreshToken),
        tokenFamily,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: provisionalExpiry,
        lastUsedAt: now,
      },
      select: { id: true },
    });
    const { token, expiresAt } = createAccessToken(user.id, session.id, input.rememberMe);

    await transaction.userSession.update({
      where: { id: session.id },
      data: { accessTokenHash: hashToken(token), expiresAt },
    });
    await transaction.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now, failedLoginAttempts: 0, lockedUntil: null },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: user.id,
        action: AuditAction.LOGIN,
        entityType: "AUTHENTICATION",
        entityId: session.id.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { event: "LOGIN_SUCCESS" },
      },
    });

    return { accessToken: token, expiresAt };
  });
}

export async function getAuthenticatedUser(token: string): Promise<AuthenticatedUser | null> {
  const payload = verifyAccessToken(token);

  if (!payload) return null;

  const session = await prisma.userSession.findFirst({
    where: {
      id: BigInt(payload.sid),
      userId: BigInt(payload.sub),
      accessTokenHash: hashToken(token),
      status: SessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          profile: true,
          roles: {
            where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            include: { role: true },
          },
          businessMemberships: {
            where: { deletedAt: null, status: BusinessMembershipStatus.ACTIVE },
            include: { business: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!session || session.user.status !== UserStatus.ACTIVE || session.user.deletedAt) {
    return null;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    fullName: session.user.profile?.fullName ?? session.user.email,
    roles: session.user.roles.map(({ role }) => role.name),
    businessName: session.user.businessMemberships[0]?.business.name ?? null,
  };
}

export async function logout(token: string, context: RequestContext): Promise<void> {
  const payload = verifyAccessToken(token);

  if (!payload) return;

  await prisma.$transaction(async (transaction) => {
    const session = await transaction.userSession.findFirst({
      where: {
        id: BigInt(payload.sid),
        accessTokenHash: hashToken(token),
        status: SessionStatus.ACTIVE,
      },
      select: { id: true, userId: true },
    });

    if (!session) return;

    await transaction.userSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: "USER_LOGOUT",
      },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: AuditAction.LOGOUT,
        entityType: "AUTHENTICATION",
        entityId: session.id.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  });
}
