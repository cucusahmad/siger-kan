import { randomBytes } from "node:crypto";

import {
  AuditAction,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessStatus,
  CommodityPriority,
  ConsentType,
  Prisma,
  SystemRoleCode,
  UserStatus,
  UserType,
} from "@/app/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/token";

import type {
  RegistrationInput,
  RegistrationRequestContext,
  RegistrationResult,
} from "./registration.types";
import {
  RegistrationConfigurationError,
  RegistrationConflictError,
  RegistrationReferenceError,
} from "./registration.types";

const BUSINESS_CODE_RANDOM_BYTES = 6;

function createBusinessCode(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(BUSINESS_CODE_RANDOM_BYTES).toString("hex").toUpperCase();

  return `BUS-${date}-${suffix}`;
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2002";
}

function getUniqueConstraintFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;

  return Array.isArray(target)
    ? target.filter((field): field is string => typeof field === "string")
    : [];
}

export async function registerBusinessActor(
  input: RegistrationInput,
  requestContext: RegistrationRequestContext,
): Promise<RegistrationResult> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { normalizedEmail: input.email },
        { normalizedPhone: input.phone },
      ],
    },
    select: { normalizedEmail: true, normalizedPhone: true },
  });

  if (existingUser?.normalizedEmail === input.email) {
    throw new RegistrationConflictError("Email sudah terdaftar.", "email");
  }

  if (existingUser?.normalizedPhone === input.phone) {
    throw new RegistrationConflictError(
      "Nomor handphone sudah terdaftar.",
      "phone",
    );
  }

  const [passwordHash, verificationToken] = await Promise.all([
    hashPassword(input.password),
    Promise.resolve(createEmailVerificationToken()),
  ]);

  try {
    await prisma.$transaction(async (transaction) => {
      const role = await transaction.role.findFirst({
        where: {
          code: SystemRoleCode.PELAKU_USAHA,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!role) {
        throw new RegistrationConfigurationError(
          "PELAKU_USAHA role is unavailable.",
        );
      }

      const commodityReference = String(input.commodityId);
      const commodityId = /^\d+$/.test(commodityReference)
        ? BigInt(commodityReference)
        : null;
      const commodity = await transaction.commodity.findFirst({
        where: {
          OR: [
            ...(commodityId === null ? [] : [{ id: commodityId }]),
            { code: { equals: commodityReference, mode: "insensitive" } },
            { name: { equals: commodityReference, mode: "insensitive" } },
          ],
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, isOther: true },
      });

      if (!commodity) {
        throw new RegistrationReferenceError(
          "commodityId",
          "Komoditas tidak tersedia.",
        );
      }

      if (commodity.isOther && !input.commodityOther) {
        throw new RegistrationReferenceError(
          "commodityId",
          "Jelaskan komoditas lainnya.",
        );
      }

      const province = await transaction.province.findFirst({
        where: {
          name: { equals: input.province, mode: "insensitive" },
          isActive: true,
        },
        select: { id: true },
      });

      if (!province) {
        throw new RegistrationReferenceError("province", "Provinsi tidak tersedia.");
      }

      const regency = await transaction.regency.findFirst({
        where: {
          provinceId: province.id,
          name: { equals: input.cityRegency, mode: "insensitive" },
          isActive: true,
        },
        select: { id: true },
      });

      if (!regency) {
        throw new RegistrationReferenceError(
          "cityRegency",
          "Kabupaten atau kota tidak tersedia.",
        );
      }

      const user = await transaction.user.create({
        data: {
          email: input.email,
          normalizedEmail: input.email,
          phone: input.phone,
          normalizedPhone: input.phone,
          passwordHash,
          type: UserType.EXTERNAL_BUSINESS,
          status: UserStatus.PENDING_VERIFICATION,
          profile: { create: { fullName: input.fullName } },
          roles: { create: { roleId: role.id } },
        },
        select: { id: true },
      });

      const business = await transaction.business.create({
        data: {
          businessCode: createBusinessCode(),
          name: input.businessName,
          status: BusinessStatus.PENDING_VERIFICATION,
          profile: {
            create: {
              businessType: input.businessType,
              businessTypeOther: input.businessTypeOther,
              email: input.email,
              phone: input.phone,
              provinceId: province.id,
              regencyId: regency.id,
            },
          },
          members: {
            create: {
              userId: user.id,
              role: BusinessMembershipRole.OWNER,
              status: BusinessMembershipStatus.ACTIVE,
              joinedAt: new Date(),
            },
          },
          commodities: {
            create: {
              commodityId: commodity.id,
              priority: CommodityPriority.PRIMARY,
              otherDescription: commodity.isOther ? input.commodityOther : null,
            },
          },
        },
        select: { id: true },
      });

      await transaction.userConsent.createMany({
        data: [
          {
            userId: user.id,
            type: ConsentType.TERMS_OF_SERVICE,
            documentVersion: input.termsVersion,
            ipAddress: requestContext.ipAddress,
            userAgent: requestContext.userAgent,
          },
          {
            userId: user.id,
            type: ConsentType.PRIVACY_POLICY,
            documentVersion: input.privacyVersion,
            ipAddress: requestContext.ipAddress,
            userAgent: requestContext.userAgent,
          },
        ],
      });

      await transaction.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: verificationToken.tokenHash,
          expiresAt: verificationToken.expiresAt,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: AuditAction.CREATE,
          entityType: "BUSINESS_REGISTRATION",
          entityId: business.id.toString(),
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
          metadata: {
            registrationStatus: BusinessStatus.PENDING_VERIFICATION,
            source: "PUBLIC_REGISTRATION",
          },
        },
      });
    });
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      const fields = getUniqueConstraintFields(error);

      if (fields.some((field) => ["normalized_email", "normalizedEmail"].includes(field))) {
        throw new RegistrationConflictError("Email sudah terdaftar.", "email");
      }

      if (fields.some((field) => ["normalized_phone", "normalizedPhone"].includes(field))) {
        throw new RegistrationConflictError(
          "Nomor handphone sudah terdaftar.",
          "phone",
        );
      }

      throw new RegistrationConflictError(
        "Email atau nomor handphone sudah terdaftar.",
      );
    }

    throw error;
  }

  return { registrationStatus: "PENDING_VERIFICATION" };
}
