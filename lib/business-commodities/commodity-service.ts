import { AuditAction, CommodityPriority } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { BusinessCommoditiesInput } from "./commodity-schema";

export interface BusinessCommodityDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly scientificName: string | null;
  readonly isOther: boolean;
  readonly priority: "PRIMARY" | "SECONDARY" | null;
  readonly otherDescription: string;
}

export interface BusinessCommoditiesData {
  readonly businessName: string;
  readonly canEdit: boolean;
  readonly commodities: readonly BusinessCommodityDto[];
}

export async function getBusinessCommodities(userId: string, hasUpdatePermission: boolean): Promise<BusinessCommoditiesData | null> {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) return null;
  const commodities = await prisma.commodity.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true, code: true, name: true, scientificName: true, isOther: true,
      businesses: { where: { businessId: membership.businessId, deletedAt: null }, select: { priority: true, otherDescription: true }, take: 1 },
    },
  });
  return {
    businessName: membership.business.name,
    canEdit: hasUpdatePermission && editableBusinessRoles.has(membership.role),
    commodities: commodities.map(({ id, code, name, scientificName, isOther, businesses }) => ({
      id: id.toString(), code, name, scientificName, isOther,
      priority: businesses[0]?.priority ?? null,
      otherDescription: businesses[0]?.otherDescription ?? "",
    })),
  };
}

export async function updateBusinessCommodities(userId: string, input: BusinessCommoditiesInput, context: RequestContext): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const membership = await transaction.businessMember.findFirst({
      where: {
        userId: BigInt(userId), status: "ACTIVE", deletedAt: null, business: { deletedAt: null },
        user: { roles: { some: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], role: { isActive: true, deletedAt: null, permissions: { some: { permission: { code: "business.update", isActive: true, deletedAt: null } } } } } } },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { id: "asc" }],
      select: { businessId: true, role: true },
    });
    if (!membership || !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");

    const selectedIds = [input.primaryCommodityId, ...input.secondaryCommodityIds].map(BigInt);
    const validCommodities = await transaction.commodity.findMany({ where: { id: { in: selectedIds }, isActive: true, deletedAt: null }, select: { id: true, isOther: true } });
    if (validCommodities.length !== selectedIds.length) throw new Error("INVALID_COMMODITY");
    for (const commodity of validCommodities) {
      if (commodity.isOther && !input.otherDescriptions[commodity.id.toString()]?.trim()) throw new Error("OTHER_DESCRIPTION_REQUIRED");
    }

    const previous = await transaction.businessCommodity.findMany({ where: { businessId: membership.businessId, deletedAt: null }, select: { commodityId: true, priority: true, otherDescription: true } });
    await transaction.businessCommodity.updateMany({ where: { businessId: membership.businessId, commodityId: { notIn: selectedIds }, deletedAt: null }, data: { deletedAt: new Date() } });
    for (const commodityId of selectedIds) {
      const id = commodityId.toString();
      const priority = id === input.primaryCommodityId ? CommodityPriority.PRIMARY : CommodityPriority.SECONDARY;
      const otherDescription = input.otherDescriptions[id]?.trim() || null;
      await transaction.businessCommodity.upsert({
        where: { businessId_commodityId: { businessId: membership.businessId, commodityId } },
        create: { businessId: membership.businessId, commodityId, priority, otherDescription },
        update: { priority, otherDescription, deletedAt: null },
      });
    }
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.UPDATE,
      entityType: "BUSINESS_COMMODITIES", entityId: membership.businessId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent,
      previousValue: previous.map((item) => ({ commodityId: item.commodityId.toString(), priority: item.priority, otherDescription: item.otherDescription })),
      newValue: selectedIds.map((commodityId) => ({ commodityId: commodityId.toString(), priority: commodityId.toString() === input.primaryCommodityId ? "PRIMARY" : "SECONDARY", otherDescription: input.otherDescriptions[commodityId.toString()]?.trim() || null })),
    } });
  });
}
