import { AuditAction, CommodityPriority, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import { calculateProfileCompleteness } from "./business-profile-completeness";
import { emptyToNull, type BusinessProfileInput } from "./business-profile-schema";
import { editableBusinessRoles, resolveCurrentBusiness } from "./get-current-business";

export interface SelectOptionDto { readonly id: string; readonly name: string; }

const profileSelect = {
  businessCode: true, name: true, status: true, updatedAt: true,
  profile: { select: {
    businessType: true, businessTypeOther: true, tradeName: true, legalEntityType: true,
    businessScale: true, yearEstablished: true, operationalStatus: true, employeeCount: true,
    productionCapacity: true, productionUnit: true, nib: true, taxNumber: true, siupNumber: true,
    pirtNumber: true, halalNumber: true, distributionPermitNumber: true, otherLegalNumber: true,
    picName: true, picPosition: true, email: true, phone: true, whatsapp: true, website: true,
    instagram: true, facebook: true, tiktok: true, addressLine: true, villageId: true,
    districtId: true, regencyId: true, provinceId: true, postalCode: true, latitude: true,
    longitude: true, description: true, updatedAt: true,
  } },
  commodities: { where: { deletedAt: null }, orderBy: [{ priority: "asc" }, { commodity: { name: "asc" } }], select: { commodityId: true, priority: true, otherDescription: true, commodity: { select: { name: true, isOther: true } } } },
  legalDocuments: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, select: { id: true, type: true, documentNumber: true, documentName: true, originalFileName: true, mimeType: true, fileSizeBytes: true, verificationStatus: true, issuedAt: true, expiresAt: true, updatedAt: true } },
} satisfies Prisma.BusinessSelect;

function value(value: string | null | undefined): string { return value ?? ""; }

export async function getBusinessProfileData(userId: string, hasUpdatePermission: boolean) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) return null;
  const [business, provinces, commodities] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: membership.businessId }, select: profileSelect }),
    prisma.province.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.commodity.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, isOther: true } }),
  ]);
  const profile = business.profile;
  if (!profile) return null;
  const commodityIds = business.commodities.map(({ commodityId }) => commodityId.toString());
  const form = {
    name: business.name, tradeName: value(profile.tradeName), businessType: profile.businessType,
    businessTypeOther: value(profile.businessTypeOther), legalEntityType: value(profile.legalEntityType), businessScale: value(profile.businessScale),
    yearEstablished: profile.yearEstablished?.toString() ?? "", operationalStatus: value(profile.operationalStatus), employeeCount: profile.employeeCount?.toString() ?? "",
    productionCapacity: profile.productionCapacity?.toString() ?? "", productionUnit: value(profile.productionUnit), description: value(profile.description),
    provinceId: profile.provinceId.toString(), regencyId: profile.regencyId.toString(), districtId: profile.districtId?.toString() ?? "", villageId: profile.villageId?.toString() ?? "",
    postalCode: value(profile.postalCode), addressLine: value(profile.addressLine), latitude: profile.latitude?.toString() ?? "", longitude: profile.longitude?.toString() ?? "",
    picName: value(profile.picName), picPosition: value(profile.picPosition), email: value(profile.email), phone: value(profile.phone), whatsapp: value(profile.whatsapp),
    website: value(profile.website), instagram: value(profile.instagram), facebook: value(profile.facebook), tiktok: value(profile.tiktok),
    nib: value(profile.nib), taxNumber: value(profile.taxNumber), siupNumber: value(profile.siupNumber), pirtNumber: value(profile.pirtNumber), halalNumber: value(profile.halalNumber),
    distributionPermitNumber: value(profile.distributionPermitNumber), otherLegalNumber: value(profile.otherLegalNumber), commodityIds,
  };
  return {
    business: { code: business.businessCode, name: business.name, status: business.status, membershipRole: membership.role, canEdit: hasUpdatePermission && editableBusinessRoles.has(membership.role), updatedAt: (profile.updatedAt ?? business.updatedAt).toISOString() },
    form,
    completeness: calculateProfileCompleteness({ ...form, yearEstablished: profile.yearEstablished, commodityIds }),
    provinces: provinces.map(({ id, name }) => ({ id: id.toString(), name })),
    commodities: commodities.map(({ id, name, isOther }) => ({ id: id.toString(), name, isOther })),
    selectedCommodities: business.commodities.map(({ commodityId, priority, otherDescription, commodity }) => ({ id: commodityId.toString(), name: commodity.name, priority, isOther: commodity.isOther, otherDescription })),
    documents: business.legalDocuments.map((document) => ({ id: document.id.toString(), type: document.type, documentNumber: document.documentNumber, documentName: document.documentName, originalFileName: document.originalFileName, mimeType: document.mimeType, fileSizeBytes: document.fileSizeBytes.toString(), verificationStatus: document.verificationStatus, issuedAt: document.issuedAt?.toISOString() ?? null, expiresAt: document.expiresAt?.toISOString() ?? null, updatedAt: document.updatedAt.toISOString() })),
  };
}

export async function updateBusinessProfile(userId: string, input: BusinessProfileInput, context: RequestContext) {
  return prisma.$transaction(async (transaction) => {
    const membership = await transaction.businessMember.findFirst({ where: {
      userId: BigInt(userId), status: "ACTIVE", deletedAt: null, business: { deletedAt: null },
      user: { roles: { some: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], role: { isActive: true, deletedAt: null, permissions: { some: { permission: { code: "business.update", isActive: true, deletedAt: null } } } } } } },
    }, orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { id: "asc" }], select: { businessId: true, role: true } });
    if (!membership || !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
    const provinceId = BigInt(input.provinceId); const regencyId = BigInt(input.regencyId);
    const districtId = input.districtId ? BigInt(input.districtId) : null; const villageId = input.villageId ? BigInt(input.villageId) : null;
    const regency = await transaction.regency.findFirst({ where: { id: regencyId, provinceId, isActive: true }, select: { id: true } });
    if (!regency) throw new Error("INVALID_REGENCY");
    if (districtId) { const district = await transaction.district.findFirst({ where: { id: districtId, regencyId, isActive: true }, select: { id: true } }); if (!district) throw new Error("INVALID_DISTRICT"); }
    if (villageId) { if (!districtId) throw new Error("INVALID_VILLAGE"); const village = await transaction.village.findFirst({ where: { id: villageId, districtId, isActive: true }, select: { id: true } }); if (!village) throw new Error("INVALID_VILLAGE"); }
    const commodityIds = input.commodityIds.map(BigInt);
    const validCommodityCount = await transaction.commodity.count({ where: { id: { in: commodityIds }, isActive: true, deletedAt: null } });
    if (validCommodityCount !== commodityIds.length) throw new Error("INVALID_COMMODITY");
    await transaction.business.update({ where: { id: membership.businessId }, data: { name: input.name, profile: { update: {
      tradeName: emptyToNull(input.tradeName), businessType: input.businessType, businessTypeOther: emptyToNull(input.businessTypeOther), legalEntityType: emptyToNull(input.legalEntityType), businessScale: emptyToNull(input.businessScale),
      yearEstablished: input.yearEstablished === "" ? null : Number(input.yearEstablished), operationalStatus: emptyToNull(input.operationalStatus), employeeCount: input.employeeCount === "" ? null : Number(input.employeeCount),
      productionCapacity: input.productionCapacity === "" ? null : input.productionCapacity, productionUnit: emptyToNull(input.productionUnit), description: emptyToNull(input.description),
      provinceId, regencyId, districtId, villageId, postalCode: emptyToNull(input.postalCode), addressLine: emptyToNull(input.addressLine), latitude: input.latitude === "" ? null : input.latitude, longitude: input.longitude === "" ? null : input.longitude,
      picName: emptyToNull(input.picName), picPosition: emptyToNull(input.picPosition), email: emptyToNull(input.email)?.toLowerCase() ?? null, phone: emptyToNull(input.phone), whatsapp: emptyToNull(input.whatsapp), website: emptyToNull(input.website), instagram: emptyToNull(input.instagram), facebook: emptyToNull(input.facebook), tiktok: emptyToNull(input.tiktok),
      nib: emptyToNull(input.nib), taxNumber: emptyToNull(input.taxNumber), siupNumber: emptyToNull(input.siupNumber), pirtNumber: emptyToNull(input.pirtNumber), halalNumber: emptyToNull(input.halalNumber), distributionPermitNumber: emptyToNull(input.distributionPermitNumber), otherLegalNumber: emptyToNull(input.otherLegalNumber),
    } } } });
    await transaction.businessCommodity.updateMany({ where: { businessId: membership.businessId, commodityId: { in: commodityIds } }, data: { deletedAt: null } });
    await transaction.businessCommodity.updateMany({ where: { businessId: membership.businessId, commodityId: { notIn: commodityIds }, deletedAt: null }, data: { deletedAt: new Date() } });
    for (const [index, commodityId] of commodityIds.entries()) await transaction.businessCommodity.upsert({ where: { businessId_commodityId: { businessId: membership.businessId, commodityId } }, create: { businessId: membership.businessId, commodityId, priority: index === 0 ? CommodityPriority.PRIMARY : CommodityPriority.SECONDARY }, update: { deletedAt: null, priority: index === 0 ? CommodityPriority.PRIMARY : CommodityPriority.SECONDARY } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.UPDATE, entityType: "BUSINESS_PROFILE", entityId: membership.businessId.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { updatedFields: Object.keys(input) } } });
    return membership.businessId;
  });
}
