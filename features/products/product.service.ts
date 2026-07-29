import {
  AuditAction,
  Prisma,
  ProductStatus,
} from "@/app/generated/prisma/client";
import { editableBusinessRoles, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { ProductInput } from "./product.schema";
import { deleteProductImageFile, saveProductImage } from "./product-storage";
import type { ProductView } from "./product.types";

const productInclude = {
  commodity: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, parent: { select: { name: true } } } },
  unit: { select: { id: true, name: true, symbol: true } },
  images: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { id: "asc" as const }] },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
const editableProductStatuses = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.REVISION_REQUIRED,
  ProductStatus.REJECTED,
]);

async function resolveBusiness(userId: string, requireEdit = false) {
  const membership = await resolveCurrentBusiness(userId);
  if (!membership) throw new Error("BUSINESS_NOT_FOUND");
  if (requireEdit && !editableBusinessRoles.has(membership.role)) throw new Error("FORBIDDEN");
  return membership;
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function decimal(value: string): Prisma.Decimal | null {
  return value ? new Prisma.Decimal(value) : null;
}

function productData(input: ProductInput) {
  return {
    sku: nullable(input.sku),
    name: input.name.trim(),
    brandName: nullable(input.brandName),
    commodityId: BigInt(input.commodityId),
    categoryId: BigInt(input.categoryId),
    unitId: BigInt(input.unitId),
    shortDescription: nullable(input.shortDescription),
    description: nullable(input.description),
    packaging: nullable(input.packaging),
    storageInstructions: nullable(input.storageInstructions),
    shelfLifeDays: input.shelfLifeDays ? Number(input.shelfLifeDays) : null,
    minimumPrice: decimal(input.minimumPrice),
    maximumPrice: decimal(input.maximumPrice),
    isPriceNegotiable: input.isPriceNegotiable,
    isPriceVisible: input.isPriceVisible,
    stockQuantity: decimal(input.stockQuantity),
    minimumOrderQuantity: decimal(input.minimumOrderQuantity),
    productionCapacity: decimal(input.productionCapacity),
    productionCapacityPeriod: input.productionCapacityPeriod || null,
    availability: input.availability,
    marketScope: input.marketScope,
  };
}

async function validateReferences(input: ProductInput) {
  const [commodity, category, unit] = await Promise.all([
    prisma.commodity.findFirst({ where: { id: BigInt(input.commodityId), isActive: true, deletedAt: null }, select: { id: true } }),
    prisma.productCategory.findFirst({ where: { id: BigInt(input.categoryId), isActive: true, deletedAt: null }, select: { id: true } }),
    prisma.unit.findFirst({ where: { id: BigInt(input.unitId), isActive: true, deletedAt: null }, select: { id: true } }),
  ]);
  if (!commodity) throw new Error("INVALID_COMMODITY");
  if (!category) throw new Error("INVALID_CATEGORY");
  if (!unit) throw new Error("INVALID_UNIT");
}

export async function getProductPageData(userId: string, canEdit: boolean) {
  const membership = await resolveBusiness(userId);
  const [products, commodities, categories, units] = await Promise.all([
    prisma.product.findMany({ where: { businessId: membership.businessId, deletedAt: null }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], include: productInclude }),
    prisma.commodity.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parent: { select: { name: true } } } }),
    prisma.unit.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } }),
  ]);
  return {
    businessName: membership.business.name,
    canEdit,
    products: products.map(serializeProduct),
    options: {
      commodities: commodities.map(({ id, name }) => ({ id: id.toString(), label: name })),
      categories: categories.map((item) => ({ id: item.id.toString(), label: item.parent ? `${item.parent.name} / ${item.name}` : item.name })),
      units: units.map((item) => ({ id: item.id.toString(), label: `${item.name} (${item.symbol})` })),
    },
  };
}

export async function createProduct(userId: string, input: ProductInput, context: RequestContext) {
  const membership = await resolveBusiness(userId, true);
  await validateReferences(input);
  const created = await prisma.$transaction(async (transaction) => {
    const product = await transaction.product.create({ data: { businessId: membership.businessId, ...productData(input) }, include: productInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: membership.businessId, action: AuditAction.CREATE, entityType: "PRODUCT", entityId: product.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return product;
  });
  return serializeProduct(created);
}

export async function updateProduct(userId: string, productId: string, input: ProductInput, context: RequestContext) {
  const product = await getOwnedProduct(userId, productId, true);
  if (!editableProductStatuses.has(product.status)) throw new Error("PRODUCT_LOCKED");
  await validateReferences(input);
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.product.update({ where: { id: product.id }, data: { ...productData(input), status: ProductStatus.DRAFT, submittedAt: null, verifiedById: null, verifiedAt: null, verificationNotes: null }, include: productInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: product.businessId, action: AuditAction.UPDATE, entityType: "PRODUCT", entityId: product.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return value;
  });
  return serializeProduct(updated);
}

export async function changeProductStatus(userId: string, productId: string, action: "SUBMIT" | "ACTIVATE" | "DEACTIVATE", context: RequestContext) {
  const product = await getOwnedProduct(userId, productId, true);
  let data: Prisma.ProductUpdateInput;
  if (action === "SUBMIT") {
    if (!editableProductStatuses.has(product.status)) throw new Error("INVALID_STATUS");
    data = { status: ProductStatus.PENDING_VERIFICATION, isPublished: false, submittedAt: new Date(), verifiedBy: { disconnect: true }, verifiedAt: null, verificationNotes: null };
  } else if (action === "ACTIVATE") {
    if (product.status !== ProductStatus.VERIFIED) throw new Error("INVALID_STATUS");
    data = { isPublished: true };
  } else {
    data = { isPublished: false };
  }
  const updated = await prisma.$transaction(async (transaction) => {
    const value = await transaction.product.update({ where: { id: product.id }, data, include: productInclude });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: product.businessId, action: AuditAction.STATUS_CHANGE, entityType: "PRODUCT", entityId: product.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent, metadata: { action } } });
    return value;
  });
  return serializeProduct(updated);
}

export async function deleteProduct(userId: string, productId: string, context: RequestContext) {
  const product = await getOwnedProduct(userId, productId, true);
  await prisma.$transaction(async (transaction) => {
    await transaction.product.update({ where: { id: product.id }, data: { deletedAt: new Date(), isPublished: false } });
    await transaction.productImage.updateMany({ where: { productId: product.id, deletedAt: null }, data: { deletedAt: new Date() } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: product.businessId, action: AuditAction.DELETE, entityType: "PRODUCT", entityId: product.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
  await Promise.all(product.images.map((image) => deleteProductImageFile(image.storageKey).catch((error: unknown) => console.error("Product image cleanup failed", { productId, imageId: image.id.toString(), error }))));
}

export async function addProductImage(userId: string, productId: string, image: { readonly buffer: Buffer; readonly extension: string; readonly mimeType: string; readonly originalName: string; readonly sizeBytes: number; readonly altText: string | null }, context: RequestContext) {
  const product = await getOwnedProduct(userId, productId, true);
  if (product.images.length >= 6) throw new Error("IMAGE_LIMIT");
  const storageKey = await saveProductImage(product.businessId, product.id, image.buffer, image.extension);
  try {
    await prisma.$transaction(async (transaction) => {
      const count = await transaction.productImage.count({ where: { productId: product.id, deletedAt: null } });
      const created = await transaction.productImage.create({ data: { productId: product.id, storageKey, originalName: image.originalName, mimeType: image.mimeType, sizeBytes: BigInt(image.sizeBytes), altText: image.altText, isPrimary: count === 0, sortOrder: count } });
      await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: product.businessId, action: AuditAction.CREATE, entityType: "PRODUCT_IMAGE", entityId: created.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
    });
  } catch (error) {
    await deleteProductImageFile(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function getOwnedProductImage(userId: string, productId: string, imageId: string) {
  const product = await getOwnedProduct(userId, productId);
  const image = product.images.find((item) => item.id.toString() === imageId);
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  return image;
}

export async function deleteProductImage(userId: string, productId: string, imageId: string, context: RequestContext) {
  const product = await getOwnedProduct(userId, productId, true);
  const image = product.images.find((item) => item.id.toString() === imageId);
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  await prisma.$transaction(async (transaction) => {
    await transaction.productImage.update({ where: { id: image.id }, data: { deletedAt: new Date() } });
    if (image.isPrimary) {
      const next = await transaction.productImage.findFirst({ where: { productId: product.id, id: { not: image.id }, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
      if (next) await transaction.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), businessId: product.businessId, action: AuditAction.DELETE, entityType: "PRODUCT_IMAGE", entityId: image.id.toString(), ipAddress: context.ipAddress, userAgent: context.userAgent } });
  });
  await deleteProductImageFile(image.storageKey);
}

async function getOwnedProduct(userId: string, productId: string, requireEdit = false): Promise<ProductRecord> {
  if (!/^\d+$/.test(productId)) throw new Error("PRODUCT_NOT_FOUND");
  const membership = await resolveBusiness(userId, requireEdit);
  const product = await prisma.product.findFirst({ where: { id: BigInt(productId), businessId: membership.businessId, deletedAt: null }, include: productInclude });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return product;
}

function serializeProduct(product: ProductRecord): ProductView {
  const value = (input: Prisma.Decimal | null) => input?.toString() ?? "";
  return {
    id: product.id.toString(), sku: product.sku ?? "", name: product.name, brandName: product.brandName ?? "",
    commodityId: product.commodityId.toString(), commodityName: product.commodity.name,
    categoryId: product.categoryId.toString(), categoryName: product.category.parent ? `${product.category.parent.name} / ${product.category.name}` : product.category.name,
    unitId: product.unitId.toString(), unitName: product.unit.name, unitSymbol: product.unit.symbol,
    shortDescription: product.shortDescription ?? "", description: product.description ?? "", packaging: product.packaging ?? "",
    storageInstructions: product.storageInstructions ?? "", shelfLifeDays: product.shelfLifeDays?.toString() ?? "",
    minimumPrice: value(product.minimumPrice), maximumPrice: value(product.maximumPrice),
    isPriceNegotiable: product.isPriceNegotiable, isPriceVisible: product.isPriceVisible,
    stockQuantity: value(product.stockQuantity), minimumOrderQuantity: value(product.minimumOrderQuantity),
    productionCapacity: value(product.productionCapacity), productionCapacityPeriod: product.productionCapacityPeriod ?? "",
    availability: product.availability, marketScope: product.marketScope, status: product.status,
    isPublished: product.isPublished, verificationNotes: product.verificationNotes,
    updatedAt: product.updatedAt.toISOString(),
    images: product.images.map((image) => ({ id: image.id.toString(), altText: image.altText, isPrimary: image.isPrimary, url: `/api/business/products/${product.id}/images/${image.id}` })),
  };
}

export function getProductError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Produk belum dapat diproses." };
  const errors: Record<string, { status: number; message: string }> = {
    BUSINESS_NOT_FOUND: { status: 404, message: "Usaha aktif tidak ditemukan." },
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki izin untuk mengelola produk." },
    PRODUCT_NOT_FOUND: { status: 404, message: "Produk tidak ditemukan." },
    PRODUCT_LOCKED: { status: 409, message: "Produk yang sedang diverifikasi atau sudah terverifikasi tidak dapat diubah." },
    INVALID_STATUS: { status: 422, message: "Perubahan status produk tidak diizinkan." },
    INVALID_COMMODITY: { status: 422, message: "Komoditas tidak valid atau sudah tidak aktif." },
    INVALID_CATEGORY: { status: 422, message: "Kategori produk tidak valid." },
    INVALID_UNIT: { status: 422, message: "Satuan produk tidak valid." },
    IMAGE_REQUIRED: { status: 422, message: "Pilih gambar produk." },
    INVALID_IMAGE_TYPE: { status: 422, message: "Gambar harus berformat JPEG, PNG, atau WebP." },
    IMAGE_TOO_LARGE: { status: 413, message: "Ukuran gambar maksimal 5 MB." },
    ALT_TEXT_TOO_LONG: { status: 422, message: "Teks alternatif gambar maksimal 200 karakter." },
    IMAGE_LIMIT: { status: 422, message: "Maksimal 6 gambar untuk setiap produk." },
    IMAGE_NOT_FOUND: { status: 404, message: "Gambar produk tidak ditemukan." },
  };
  if (errors[error.message]) return errors[error.message];
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: 409, message: "SKU sudah digunakan oleh produk lain pada usaha ini." };
  return { status: 500, message: "Produk belum dapat diproses. Silakan coba kembali." };
}
