import { AuditAction, BusinessNeedStatus, Prisma } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { getBusinessOffers } from "@/features/business-offers/business-offer.service";

import type { BusinessNeedInput } from "./business-need.schema";
import type { BusinessNeedView, BusinessOpportunityView } from "./business-need.types";

const businessNeedInclude = {
  commodity: { select: { name: true } },
  category: { select: { name: true, parent: { select: { name: true } } } },
  unit: { select: { name: true, symbol: true } },
} satisfies Prisma.BusinessNeedInclude;

type BusinessNeedRecord = Prisma.BusinessNeedGetPayload<{ include: typeof businessNeedInclude }>;

async function resolveBusiness(userId: string, requireEdit = false) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  if (requireEdit && !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function needData(input: BusinessNeedInput) {
  return {
    title: input.title.trim(),
    commodityId: BigInt(input.commodityId),
    categoryId: BigInt(input.categoryId),
    unitId: BigInt(input.unitId),
    description: input.description.trim(),
    specifications: nullable(input.specifications),
    quantity: new Prisma.Decimal(input.quantity),
    minimumBudget: input.minimumBudget ? new Prisma.Decimal(input.minimumBudget) : null,
    maximumBudget: input.maximumBudget ? new Prisma.Decimal(input.maximumBudget) : null,
    isBudgetNegotiable: input.isBudgetNegotiable,
    deliveryLocation: input.deliveryLocation.trim(),
    requiredAt: input.requiredAt ? new Date(`${input.requiredAt}T00:00:00.000Z`) : null,
  };
}

async function validateReferences(input: BusinessNeedInput) {
  const [commodity, category, unit] = await Promise.all([
    prisma.commodity.findFirst({ where: { id: BigInt(input.commodityId), isActive: true, deletedAt: null }, select: { id: true } }),
    prisma.productCategory.findFirst({ where: { id: BigInt(input.categoryId), isActive: true, deletedAt: null }, select: { id: true } }),
    prisma.unit.findFirst({ where: { id: BigInt(input.unitId), isActive: true, deletedAt: null }, select: { id: true } }),
  ]);
  if (!commodity) throw new Error("INVALID_COMMODITY");
  if (!category) throw new Error("INVALID_CATEGORY");
  if (!unit) throw new Error("INVALID_UNIT");
}

export async function getBusinessNeedPageData(userId: string, canEdit: boolean) {
  const membership = await resolveBusiness(userId);
  const [needs, opportunities, offers, commodities, categories, units] = await Promise.all([
    prisma.businessNeed.findMany({
      where: { businessId: membership.businessId, deletedAt: null },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: businessNeedInclude,
    }),
    prisma.businessNeed.findMany({
      where: {
        businessId: { not: membership.businessId },
        status: BusinessNeedStatus.PUBLISHED,
        deletedAt: null,
        business: { deletedAt: null },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: 100,
      include: {
        ...businessNeedInclude,
        business: {
          select: {
            name: true,
            profile: {
              select: {
                tradeName: true,
                regency: { select: { name: true } },
                province: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    getBusinessOffers(userId),
    prisma.commodity.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parent: { select: { name: true } } } }),
    prisma.unit.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } }),
  ]);
  return {
    businessName: membership.business.name,
    canEdit,
    needs: needs.map(serializeNeed),
    opportunities: opportunities.map((need): BusinessOpportunityView => ({
      ...serializeNeed(need),
      businessName: need.business.profile?.tradeName || need.business.name,
      businessLocation: [need.business.profile?.regency.name, need.business.profile?.province.name].filter(Boolean).join(", ") || "Lokasi belum dilengkapi",
    })),
    offers,
    options: {
      commodities: commodities.map(({ id, name }) => ({ id: id.toString(), label: name })),
      categories: categories.map((item) => ({ id: item.id.toString(), label: item.parent ? `${item.parent.name} / ${item.name}` : item.name })),
      units: units.map((item) => ({ id: item.id.toString(), label: `${item.name} (${item.symbol})` })),
    },
  };
}

export async function createBusinessNeed(userId: string, input: BusinessNeedInput, context: RequestContext) {
  const membership = await resolveBusiness(userId, true);
  await validateReferences(input);
  const created = await prisma.$transaction(async (transaction) => {
    const need = await transaction.businessNeed.create({ data: { businessId: membership.businessId, ...needData(input) }, include: businessNeedInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.CREATE, entityType: "BUSINESS_NEED", entityId: need.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return need;
  });
  return serializeNeed(created);
}

export async function updateBusinessNeed(userId: string, needId: string, input: BusinessNeedInput, context: RequestContext) {
  const need = await getOwnedNeed(userId, needId, true);
  if (need.status !== BusinessNeedStatus.DRAFT) throw new Error("NEED_LOCKED");
  await validateReferences(input);
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.businessNeed.update({ where: { id: need.id }, data: needData(input), include: businessNeedInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: need.businessId, action: AuditAction.UPDATE, entityType: "BUSINESS_NEED", entityId: need.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return value;
  });
  return serializeNeed(updated);
}

export async function changeBusinessNeedStatus(userId: string, needId: string, action: "PUBLISH" | "CLOSE" | "REOPEN", context: RequestContext) {
  const need = await getOwnedNeed(userId, needId, true);
  const now = new Date();
  let data: Prisma.BusinessNeedUpdateInput;
  if (action === "PUBLISH") {
    if (need.status !== BusinessNeedStatus.DRAFT) throw new Error("INVALID_STATUS");
    data = { status: BusinessNeedStatus.PUBLISHED, publishedAt: now, closedAt: null };
  } else if (action === "CLOSE") {
    if (need.status !== BusinessNeedStatus.PUBLISHED) throw new Error("INVALID_STATUS");
    data = { status: BusinessNeedStatus.CLOSED, closedAt: now };
  } else {
    if (need.status !== BusinessNeedStatus.CLOSED) throw new Error("INVALID_STATUS");
    data = { status: BusinessNeedStatus.PUBLISHED, closedAt: null };
  }
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.businessNeed.update({ where: { id: need.id }, data, include: businessNeedInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: need.businessId, action: AuditAction.STATUS_CHANGE, entityType: "BUSINESS_NEED", entityId: need.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { action } } });
    return value;
  });
  return serializeNeed(updated);
}

export async function deleteBusinessNeed(userId: string, needId: string, context: RequestContext) {
  const need = await getOwnedNeed(userId, needId, true);
  if (need.status !== BusinessNeedStatus.DRAFT) throw new Error("NEED_LOCKED");
  await prisma.$transaction(async (transaction) => {
    await transaction.businessNeed.update({ where: { id: need.id }, data: { deletedAt: new Date() } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: need.businessId, action: AuditAction.DELETE, entityType: "BUSINESS_NEED", entityId: need.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
}

async function getOwnedNeed(userId: string, needId: string, requireEdit = false): Promise<BusinessNeedRecord> {
  if (!/^\d+$/.test(needId)) throw new Error("NEED_NOT_FOUND");
  const membership = await resolveBusiness(userId, requireEdit);
  const need = await prisma.businessNeed.findFirst({ where: { id: BigInt(needId), businessId: membership.businessId, deletedAt: null }, include: businessNeedInclude });
  if (!need) throw new Error("NEED_NOT_FOUND");
  return need;
}

function serializeNeed(need: BusinessNeedRecord): BusinessNeedView {
  return {
    id: need.id.toString(),
    title: need.title,
    commodityId: need.commodityId.toString(),
    commodityName: need.commodity.name,
    categoryId: need.categoryId.toString(),
    categoryName: need.category.parent ? `${need.category.parent.name} / ${need.category.name}` : need.category.name,
    unitId: need.unitId.toString(),
    unitName: need.unit.name,
    unitSymbol: need.unit.symbol,
    description: need.description,
    specifications: need.specifications ?? "",
    quantity: need.quantity.toString(),
    minimumBudget: need.minimumBudget?.toString() ?? "",
    maximumBudget: need.maximumBudget?.toString() ?? "",
    isBudgetNegotiable: need.isBudgetNegotiable,
    deliveryLocation: need.deliveryLocation,
    requiredAt: need.requiredAt?.toISOString().slice(0, 10) ?? "",
    status: need.status,
    publishedAt: need.publishedAt?.toISOString() ?? null,
    updatedAt: need.updatedAt.toISOString(),
  };
}

export function getBusinessNeedError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Kebutuhan belum dapat diproses." };
  const errors: Record<string, { readonly status: number; readonly message: string }> = {
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki izin untuk mengelola kebutuhan usaha." },
    NEED_NOT_FOUND: { status: 404, message: "Kebutuhan tidak ditemukan." },
    NEED_LOCKED: { status: 409, message: "Hanya kebutuhan berstatus draf yang dapat diubah atau dihapus." },
    INVALID_STATUS: { status: 422, message: "Perubahan status kebutuhan tidak diizinkan." },
    INVALID_COMMODITY: { status: 422, message: "Komoditas tidak valid atau sudah tidak aktif." },
    INVALID_CATEGORY: { status: 422, message: "Kategori produk tidak valid." },
    INVALID_UNIT: { status: 422, message: "Satuan tidak valid." },
  };
  return errors[error.message] ?? { status: 500, message: "Kebutuhan belum dapat diproses. Silakan coba kembali." };
}
