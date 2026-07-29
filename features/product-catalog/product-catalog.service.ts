import { Prisma, ProductStatus } from "@/app/generated/prisma/client";
import { resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";

import type { CatalogProductView, ProductCatalogData } from "./product-catalog.types";

const catalogInclude = {
  business: { select: { id: true, name: true, profile: { select: { tradeName: true } } } },
  commodity: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, parent: { select: { name: true } } } },
  unit: { select: { symbol: true } },
  images: {
    where: { deletedAt: null },
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { id: "asc" as const }],
    take: 1,
  },
  offers: { where: { deletedAt: null }, select: { buyerBusinessId: true } },
} satisfies Prisma.ProductInclude;

type CatalogProductRecord = Prisma.ProductGetPayload<{ include: typeof catalogInclude }>;

export async function getProductCatalogData(userId: string, canOffer: boolean): Promise<ProductCatalogData> {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      business: { deletedAt: null },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: catalogInclude,
  });

  const commodities = new Map<string, string>();
  const categories = new Map<string, string>();
  products.forEach((product) => {
    commodities.set(product.commodity.id.toString(), product.commodity.name);
    categories.set(product.category.id.toString(), product.category.parent
      ? `${product.category.parent.name} / ${product.category.name}`
      : product.category.name);
  });

  return {
    businessName: membership.business.name,
    canOffer,
    products: products.map((product) => serializeCatalogProduct(product, membership.businessId)),
    commodities: [...commodities].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, "id")),
    categories: [...categories].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, "id")),
  };
}

export async function getPublishedProductImage(productId: string, imageId: string) {
  if (!/^\d+$/.test(productId) || !/^\d+$/.test(imageId)) throw new Error("IMAGE_NOT_FOUND");
  const image = await prisma.productImage.findFirst({
    where: {
      id: BigInt(imageId),
      productId: BigInt(productId),
      deletedAt: null,
      product: { deletedAt: null, business: { deletedAt: null } },
    },
    select: { storageKey: true, mimeType: true, sizeBytes: true },
  });
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  return image;
}

function serializeCatalogProduct(product: CatalogProductRecord, currentBusinessId: bigint): CatalogProductView {
  const categoryName = product.category.parent
    ? `${product.category.parent.name} / ${product.category.name}`
    : product.category.name;
  const image = product.images[0];
  return {
    id: product.id.toString(),
    businessName: product.business.profile?.tradeName || product.business.name,
    name: product.name,
    brandName: product.brandName ?? "",
    commodityId: product.commodity.id.toString(),
    commodityName: product.commodity.name,
    categoryId: product.category.id.toString(),
    categoryName,
    unitSymbol: product.unit.symbol,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    packaging: product.packaging ?? "",
    minimumPrice: product.minimumPrice?.toString() ?? "",
    maximumPrice: product.maximumPrice?.toString() ?? "",
    isPriceNegotiable: product.isPriceNegotiable,
    isPriceVisible: product.isPriceVisible,
    stockQuantity: product.stockQuantity?.toString() ?? "",
    minimumOrderQuantity: product.minimumOrderQuantity?.toString() ?? "",
    availability: product.availability,
    marketScope: product.marketScope,
    status: product.status,
    isPublished: product.isPublished,
    canReceiveOffer: product.status === ProductStatus.VERIFIED && product.isPublished,
    imageUrl: image ? `/api/catalog/products/${product.id}/images/${image.id}` : null,
    isOwnProduct: product.businessId === currentBusinessId,
    hasSubmittedOffer: product.offers.some((offer) => offer.buyerBusinessId === currentBusinessId),
  };
}
