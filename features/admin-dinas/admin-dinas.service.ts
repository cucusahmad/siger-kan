import { AuditAction, BusinessStatus } from "@/app/generated/prisma/client";
import { listBusinessDocumentsByBusinessId } from "@/lib/business-documents/document-service";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { emptyToNull } from "@/lib/business/business-profile-schema";

import type { AdminBusinessDetail, AdminDashboardData } from "./admin-dinas.types";
import type { AdminBusinessUpdateInput } from "./admin-dinas.validation";

function formatAddress(profile: {
  readonly addressLine: string | null;
  readonly village: { readonly name: string } | null;
  readonly district: { readonly name: string } | null;
  readonly regency: { readonly name: string };
  readonly province: { readonly name: string };
  readonly postalCode: string | null;
}): string {
  return [profile.addressLine, profile.village?.name, profile.district?.name, profile.regency.name, profile.province.name, profile.postalCode]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [businesses, activeBusinesses, pendingBusinesses, totalBusinessUsers] = await prisma.$transaction([
    prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        profile: { include: { regency: true, province: true } },
        members: {
          where: { deletedAt: null, role: "OWNER" },
          take: 1,
          include: { user: { include: { profile: true } } },
        },
        _count: {
          select: {
            commodities: { where: { deletedAt: null } },
            legalDocuments: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.business.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.business.count({ where: { deletedAt: null, status: "PENDING_VERIFICATION" } }),
    prisma.user.count({ where: { deletedAt: null, type: "EXTERNAL_BUSINESS" } }),
  ]);

  return {
    statistics: { totalBusinesses: businesses.length, activeBusinesses, pendingBusinesses, totalBusinessUsers },
    businesses: businesses.map((business) => {
      const owner = business.members[0]?.user;
      return {
        id: business.id.toString(),
        code: business.businessCode,
        name: business.name,
        ownerName: owner?.profile?.fullName ?? "Belum ditentukan",
        ownerEmail: business.profile?.email ?? owner?.email ?? "-",
        phone: business.profile?.phone ?? business.profile?.whatsapp ?? owner?.phone ?? "-",
        businessType: business.profile?.businessType ?? "OTHER",
        location: business.profile
          ? [business.profile.addressLine, business.profile.regency.name, business.profile.province.name]
              .filter((value): value is string => Boolean(value)).join(", ")
          : "Belum dilengkapi",
        region: business.profile?.regency.name ?? "Belum dilengkapi",
        status: business.status,
        commodityCount: business._count.commodities,
        documentCount: business._count.legalDocuments,
        createdAt: business.createdAt.toISOString(),
      };
    }),
  };
}

export async function getAdminBusinessDetail(businessId: string): Promise<AdminBusinessDetail | null> {
  if (!/^\d+$/.test(businessId)) return null;
  const business = await prisma.business.findFirst({
    where: { id: BigInt(businessId), deletedAt: null },
    include: {
      profile: { include: { village: true, district: true, regency: true, province: true } },
      members: {
        where: { deletedAt: null },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        include: { user: { include: { profile: true } } },
      },
      commodities: { where: { deletedAt: null }, orderBy: { priority: "asc" }, include: { commodity: true } },
    },
  });
  if (!business) return null;
  const documents = await listBusinessDocumentsByBusinessId(business.id, true);

  return {
    id: business.id.toString(), code: business.businessCode, name: business.name,
    status: business.status, createdAt: business.createdAt.toISOString(), verifiedAt: business.verifiedAt?.toISOString() ?? null,
    profile: business.profile ? {
      businessType: business.profile.businessType, tradeName: business.profile.tradeName,
      legalEntityType: business.profile.legalEntityType, businessScale: business.profile.businessScale,
      yearEstablished: business.profile.yearEstablished, employeeCount: business.profile.employeeCount,
      productionCapacity: business.profile.productionCapacity?.toString() ?? null, productionUnit: business.profile.productionUnit,
      picName: business.profile.picName, picPosition: business.profile.picPosition, email: business.profile.email,
      phone: business.profile.phone, whatsapp: business.profile.whatsapp, address: formatAddress(business.profile),
      description: business.profile.description, nib: business.profile.nib, taxNumber: business.profile.taxNumber,
      siupNumber: business.profile.siupNumber, pirtNumber: business.profile.pirtNumber,
      halalNumber: business.profile.halalNumber, distributionPermitNumber: business.profile.distributionPermitNumber,
    } : null,
    members: business.members.map((member) => ({
      id: member.user.id.toString(), name: member.user.profile?.fullName ?? member.user.email,
      email: member.user.email, phone: member.user.phone, role: member.role, status: member.status,
      emailVerifiedAt: member.user.emailVerifiedAt?.toISOString() ?? null,
    })),
    documents,
    commodities: business.commodities.map((item) => ({
      id: item.commodity.id.toString(), name: item.commodity.name, scientificName: item.commodity.scientificName,
      priority: item.priority, description: item.otherDescription,
    })),
  };
}

export async function verifyAdminBusiness(actorUserId: string, businessId: string, context: RequestContext): Promise<void> {
  if (!/^\d+$/.test(businessId)) throw new Error("NOT_FOUND");
  await prisma.$transaction(async (transaction) => {
    const id = BigInt(businessId);
    const business = await transaction.business.findFirst({ where: { id, deletedAt: null }, select: { status: true, verifiedAt: true } });
    if (!business) throw new Error("NOT_FOUND");
    const now = new Date();
    await transaction.business.update({ where: { id }, data: { status: BusinessStatus.ACTIVE, verifiedAt: now } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(actorUserId), businessId: id, action: AuditAction.APPROVE, entityType: "BUSINESS", entityId: businessId, previousValue: { status: business.status, verifiedAt: business.verifiedAt?.toISOString() ?? null }, newValue: { status: BusinessStatus.ACTIVE, verifiedAt: now.toISOString() }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
}

export async function updateAdminBusiness(actorUserId: string, businessId: string, input: AdminBusinessUpdateInput, context: RequestContext): Promise<void> {
  if (!/^\d+$/.test(businessId)) throw new Error("NOT_FOUND");
  await prisma.$transaction(async (transaction) => {
    const id = BigInt(businessId);
    const current = await transaction.business.findFirst({ where: { id, deletedAt: null }, select: { name: true, profile: true } });
    if (!current?.profile) throw new Error("NOT_FOUND");
    await transaction.business.update({ where: { id }, data: { name: input.name, profile: { update: {
      tradeName: emptyToNull(input.tradeName), legalEntityType: emptyToNull(input.legalEntityType), businessScale: emptyToNull(input.businessScale),
      yearEstablished: input.yearEstablished ? Number(input.yearEstablished) : null, employeeCount: input.employeeCount ? Number(input.employeeCount) : null,
      productionCapacity: input.productionCapacity || null, productionUnit: emptyToNull(input.productionUnit), picName: emptyToNull(input.picName), picPosition: emptyToNull(input.picPosition),
      email: emptyToNull(input.email)?.toLowerCase() ?? null, phone: emptyToNull(input.phone), whatsapp: emptyToNull(input.whatsapp), description: emptyToNull(input.description),
      nib: emptyToNull(input.nib), taxNumber: emptyToNull(input.taxNumber), siupNumber: emptyToNull(input.siupNumber), pirtNumber: emptyToNull(input.pirtNumber),
      halalNumber: emptyToNull(input.halalNumber), distributionPermitNumber: emptyToNull(input.distributionPermitNumber),
    } } } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(actorUserId), businessId: id, action: AuditAction.UPDATE, entityType: "BUSINESS_PROFILE", entityId: businessId, previousValue: { name: current.name }, newValue: input, metadata: { updatedFields: Object.keys(input) }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
}

export async function activateMemberEmail(actorUserId: string, businessId: string, memberUserId: string, context: RequestContext): Promise<void> {
  if (!/^\d+$/.test(businessId) || !/^\d+$/.test(memberUserId)) throw new Error("NOT_FOUND");
  await prisma.$transaction(async (transaction) => {
    const id = BigInt(businessId); const userId = BigInt(memberUserId);
    const membership = await transaction.businessMember.findFirst({ where: { businessId: id, userId, deletedAt: null, user: { deletedAt: null } }, select: { user: { select: { emailVerifiedAt: true } } } });
    if (!membership) throw new Error("NOT_FOUND");
    const now = new Date();
    await transaction.user.update({ where: { id: userId }, data: { emailVerifiedAt: now } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(actorUserId), businessId: id, action: AuditAction.EMAIL_VERIFY, entityType: "USER", entityId: memberUserId, previousValue: { emailVerifiedAt: membership.user.emailVerifiedAt?.toISOString() ?? null }, newValue: { emailVerifiedAt: now.toISOString() }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
}
