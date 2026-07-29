import { AuditAction, BusinessNeedStatus, BusinessOfferStatus, Prisma } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { BusinessOfferInput } from "./business-offer.schema";
import type { BusinessOfferView } from "./business-offer.types";

const offerInclude = {
  businessNeed: {
    select: {
      id: true,
      title: true,
      businessId: true,
      unit: { select: { symbol: true } },
      business: {
        select: {
          name: true,
          profile: {
            select: {
              tradeName: true, email: true, whatsapp: true, addressLine: true, postalCode: true,
              village: { select: { name: true } }, district: { select: { name: true } },
              regency: { select: { name: true } }, province: { select: { name: true } },
            },
          },
        },
      },
    },
  },
  supplierBusiness: {
    select: {
      name: true,
      profile: {
        select: {
          tradeName: true, email: true, whatsapp: true, addressLine: true, postalCode: true,
          village: { select: { name: true } }, district: { select: { name: true } },
          regency: { select: { name: true } }, province: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.BusinessOfferInclude;

type OfferRecord = Prisma.BusinessOfferGetPayload<{ include: typeof offerInclude }>;

export async function getBusinessOffers(userId: string): Promise<readonly BusinessOfferView[]> {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const offers = await prisma.businessOffer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { supplierBusinessId: membership.businessId },
        { businessNeed: { businessId: membership.businessId, deletedAt: null } },
      ],
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    include: offerInclude,
  });
  return offers.map((offer) => serializeOffer(offer, membership.businessId));
}

export async function createBusinessOffer(userId: string, input: BusinessOfferInput, context: RequestContext) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  if (!editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  const need = await prisma.businessNeed.findFirst({
    where: { id: BigInt(input.businessNeedId), status: BusinessNeedStatus.PUBLISHED, deletedAt: null },
    select: { id: true, businessId: true },
  });
  if (!need) throw new Error("NEED_NOT_AVAILABLE");
  if (need.businessId === membership.businessId) throw new Error("OWN_NEED");
  const existing = await prisma.businessOffer.findUnique({
    where: { businessNeedId_supplierBusinessId: { businessNeedId: need.id, supplierBusinessId: membership.businessId } },
    select: { id: true },
  });
  if (existing) throw new Error("OFFER_EXISTS");

  const offer = await prisma.$transaction(async (transaction) => {
    const created = await transaction.businessOffer.create({
      data: {
        businessNeedId: need.id,
        supplierBusinessId: membership.businessId,
        quantity: new Prisma.Decimal(input.quantity),
        unitPrice: new Prisma.Decimal(input.unitPrice),
        leadTimeDays: input.leadTimeDays,
        validUntil: new Date(`${input.validUntil}T00:00:00.000Z`),
        message: input.message.trim(),
      },
      include: offerInclude,
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: BigInt(userId),
        businessId: membership.businessId,
        action: AuditAction.CREATE,
        entityType: "BUSINESS_OFFER",
        entityId: created.id.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
    return created;
  });
  return serializeOffer(offer, membership.businessId);
}

export async function changeBusinessOfferStatus(
  userId: string,
  offerId: string,
  action: "WITHDRAW" | "ACCEPT" | "REJECT",
  notes: string,
  context: RequestContext,
) {
  if (!/^\d+$/.test(offerId)) throw new Error("OFFER_NOT_FOUND");
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  if (!editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  const offer = await prisma.businessOffer.findFirst({
    where: { id: BigInt(offerId), deletedAt: null },
    include: offerInclude,
  });
  if (!offer) throw new Error("OFFER_NOT_FOUND");
  if (offer.status !== BusinessOfferStatus.SUBMITTED) throw new Error("INVALID_STATUS");
  const isSupplier = offer.supplierBusinessId === membership.businessId;
  const isBuyer = offer.businessNeed.businessId === membership.businessId;
  if ((action === "WITHDRAW" && !isSupplier) || (action !== "WITHDRAW" && !isBuyer)) throw new Error("FORBIDDEN");
  const status = action === "WITHDRAW" ? BusinessOfferStatus.WITHDRAWN
    : action === "ACCEPT" ? BusinessOfferStatus.ACCEPTED : BusinessOfferStatus.REJECTED;
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.businessOffer.update({
      where: { id: offer.id },
      data: { status, respondedAt: new Date(), responseNotes: notes.trim() || null },
      include: offerInclude,
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: BigInt(userId),
        businessId: membership.businessId,
        action: AuditAction.STATUS_CHANGE,
        entityType: "BUSINESS_OFFER",
        entityId: offer.id.toString(),
        previousValue: { status: offer.status },
        newValue: { status, notes: notes.trim() || null },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
    return value;
  });
  return serializeOffer(updated, membership.businessId);
}

function serializeOffer(offer: OfferRecord, currentBusinessId: bigint): BusinessOfferView {
  const outgoing = offer.supplierBusinessId === currentBusinessId;
  const counterparty = outgoing ? offer.businessNeed.business : offer.supplierBusiness;
  return {
    id: offer.id.toString(),
    businessNeedId: offer.businessNeedId.toString(),
    needTitle: offer.businessNeed.title,
    counterpartyName: counterparty.profile?.tradeName || counterparty.name,
    quantity: offer.quantity.toString(),
    unitSymbol: offer.businessNeed.unit.symbol,
    unitPrice: offer.unitPrice.toString(),
    leadTimeDays: offer.leadTimeDays,
    validUntil: offer.validUntil.toISOString().slice(0, 10),
    message: offer.message,
    status: offer.status,
    submittedAt: offer.submittedAt.toISOString(),
    responseNotes: offer.responseNotes ?? "",
    direction: outgoing ? "OUTGOING" : "INCOMING",
    counterparty: offer.status === BusinessOfferStatus.ACCEPTED ? {
      businessName: counterparty.profile?.tradeName || counterparty.name,
      address: formatAddress(counterparty.profile),
      email: counterparty.profile?.email ?? "",
      whatsapp: counterparty.profile?.whatsapp ?? "",
    } : null,
  };
}

function formatAddress(profile: OfferRecord["supplierBusiness"]["profile"]): string {
  if (!profile) return "Alamat belum dilengkapi";
  return [
    profile.addressLine, profile.village?.name, profile.district?.name,
    profile.regency.name, profile.province.name, profile.postalCode,
  ].filter(Boolean).join(", ") || "Alamat belum dilengkapi";
}

export function getBusinessOfferError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Penawaran belum dapat diproses." };
  const errors: Record<string, { readonly status: number; readonly message: string }> = {
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki izin untuk mengelola penawaran." },
    NEED_NOT_AVAILABLE: { status: 404, message: "Peluang sudah tidak tersedia." },
    OWN_NEED: { status: 422, message: "Anda tidak dapat mengirim penawaran untuk kebutuhan usaha sendiri." },
    OFFER_EXISTS: { status: 409, message: "Usaha Anda sudah pernah mengirim penawaran untuk peluang ini." },
    OFFER_NOT_FOUND: { status: 404, message: "Penawaran tidak ditemukan." },
    INVALID_STATUS: { status: 422, message: "Status penawaran tidak dapat diubah." },
  };
  return errors[error.message] ?? { status: 500, message: "Penawaran belum dapat diproses. Silakan coba kembali." };
}
