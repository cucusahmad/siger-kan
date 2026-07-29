import { AuditAction, BusinessOfferStatus, Prisma, ProductStatus } from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { ProductOfferInput } from "./product-offer.schema";
import type { ProductOfferPageData, ProductOfferView } from "./product-offer.types";

const offerInclude = {
  product: {
    select: {
      id: true,
      name: true,
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
  buyerBusiness: {
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
} satisfies Prisma.ProductOfferInclude;

type ProductOfferRecord = Prisma.ProductOfferGetPayload<{ include: typeof offerInclude }>;

export async function getProductOfferPageData(userId: string): Promise<ProductOfferPageData> {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const offers = await prisma.productOffer.findMany({
    where: {
      deletedAt: null,
      OR: [
        { buyerBusinessId: membership.businessId },
        { product: { businessId: membership.businessId, deletedAt: null } },
      ],
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    include: offerInclude,
  });
  return {
    businessName: membership.business.name,
    offers: offers.map((offer) => serializeOffer(offer, membership.businessId)),
  };
}

export async function createProductOffer(userId: string, input: ProductOfferInput, context: RequestContext) {
  const membership = await resolveEditableBusiness(userId);
  const product = await prisma.product.findFirst({
    where: {
      id: BigInt(input.productId),
      status: ProductStatus.VERIFIED,
      isPublished: true,
      deletedAt: null,
    },
    select: { id: true, businessId: true, minimumOrderQuantity: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_AVAILABLE");
  if (product.businessId === membership.businessId) throw new Error("OWN_PRODUCT");
  if (product.minimumOrderQuantity && new Prisma.Decimal(input.quantity).lessThan(product.minimumOrderQuantity)) {
    throw new Error("MINIMUM_ORDER");
  }
  const existing = await prisma.productOffer.findUnique({
    where: { productId_buyerBusinessId: { productId: product.id, buyerBusinessId: membership.businessId } },
    select: { id: true },
  });
  if (existing) throw new Error("OFFER_EXISTS");

  const offer = await prisma.$transaction(async (transaction) => {
    const created = await transaction.productOffer.create({
      data: {
        productId: product.id,
        buyerBusinessId: membership.businessId,
        quantity: new Prisma.Decimal(input.quantity),
        unitPrice: new Prisma.Decimal(input.unitPrice),
        deliveryAddress: input.deliveryAddress.trim(),
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
        entityType: "PRODUCT_OFFER",
        entityId: created.id.toString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
    return created;
  });
  return serializeOffer(offer, membership.businessId);
}

export async function changeProductOfferStatus(
  userId: string,
  offerId: string,
  action: "WITHDRAW" | "ACCEPT" | "REJECT",
  notes: string,
  context: RequestContext,
) {
  if (!/^\d+$/.test(offerId)) throw new Error("OFFER_NOT_FOUND");
  const membership = await resolveEditableBusiness(userId);
  const offer = await prisma.productOffer.findFirst({
    where: { id: BigInt(offerId), deletedAt: null },
    include: offerInclude,
  });
  if (!offer) throw new Error("OFFER_NOT_FOUND");
  if (offer.status !== BusinessOfferStatus.SUBMITTED) throw new Error("INVALID_STATUS");
  const isBuyer = offer.buyerBusinessId === membership.businessId;
  const isOwner = offer.product.businessId === membership.businessId;
  if ((action === "WITHDRAW" && !isBuyer) || (action !== "WITHDRAW" && !isOwner)) throw new Error("FORBIDDEN");
  const status = action === "WITHDRAW"
    ? BusinessOfferStatus.WITHDRAWN
    : action === "ACCEPT"
      ? BusinessOfferStatus.ACCEPTED
      : BusinessOfferStatus.REJECTED;

  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.productOffer.update({
      where: { id: offer.id },
      data: { status, respondedAt: new Date(), responseNotes: notes.trim() || null },
      include: offerInclude,
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: BigInt(userId),
        businessId: membership.businessId,
        action: AuditAction.STATUS_CHANGE,
        entityType: "PRODUCT_OFFER",
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

async function resolveEditableBusiness(userId: string) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  if (!editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

function serializeOffer(offer: ProductOfferRecord, currentBusinessId: bigint): ProductOfferView {
  const outgoing = offer.buyerBusinessId === currentBusinessId;
  const counterparty = outgoing ? offer.product.business : offer.buyerBusiness;
  return {
    id: offer.id.toString(),
    productId: offer.productId.toString(),
    productName: offer.product.name,
    counterpartyName: counterparty.profile?.tradeName || counterparty.name,
    quantity: offer.quantity.toString(),
    unitSymbol: offer.product.unit.symbol,
    unitPrice: offer.unitPrice.toString(),
    deliveryAddress: offer.deliveryAddress,
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

function formatAddress(profile: ProductOfferRecord["buyerBusiness"]["profile"]): string {
  if (!profile) return "Alamat belum dilengkapi";
  return [
    profile.addressLine, profile.village?.name, profile.district?.name,
    profile.regency.name, profile.province.name, profile.postalCode,
  ].filter(Boolean).join(", ") || "Alamat belum dilengkapi";
}

export function getProductOfferError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Penawaran belum dapat diproses." };
  const errors: Record<string, { readonly status: number; readonly message: string }> = {
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki izin untuk mengelola penawaran." },
    PRODUCT_NOT_AVAILABLE: { status: 404, message: "Produk tidak tersedia di katalog." },
    OWN_PRODUCT: { status: 422, message: "Anda tidak dapat menawar produk milik usaha sendiri." },
    MINIMUM_ORDER: { status: 422, message: "Jumlah penawaran belum memenuhi minimum pemesanan produk." },
    OFFER_EXISTS: { status: 409, message: "Usaha Anda sudah pernah mengajukan penawaran untuk produk ini." },
    OFFER_NOT_FOUND: { status: 404, message: "Penawaran tidak ditemukan." },
    INVALID_STATUS: { status: 422, message: "Status penawaran tidak dapat diubah." },
  };
  return errors[error.message] ?? { status: 500, message: "Penawaran belum dapat diproses. Silakan coba kembali." };
}
