import { AuditAction, BusinessMembershipStatus, Prisma, ProductStatus } from "@/app/generated/prisma/client";
import type { AuthenticatedUser } from "@/features/auth/auth.types";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import type { ProductVerificationInput } from "./product-verification.schema";
import type { ProductVerificationView } from "./product-verification.types";

const allowedRoles = new Set(["ADMIN_DINAS", "SUPER_ADMIN"]);

export function canVerifyProducts(user: AuthenticatedUser): boolean {
  return user.permissions.includes("business.verify") && user.roleCodes.some((role) => allowedRoles.has(role));
}

function requireVerifier(user: AuthenticatedUser): void {
  if (!canVerifyProducts(user)) throw new Error("FORBIDDEN");
}

const verificationInclude = {
  business: { select: { id: true, name: true, businessCode: true, profile: { select: { tradeName: true, phone: true, addressLine: true } } } },
  commodity: { select: { name: true } },
  category: { select: { name: true, parent: { select: { name: true } } } },
  unit: { select: { name: true, symbol: true } },
  verifiedBy: { select: { profile: { select: { fullName: true } } } },
  images: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { id: "asc" as const }] },
} satisfies Prisma.ProductInclude;

type VerificationProduct = Prisma.ProductGetPayload<{ include: typeof verificationInclude }>;

export async function listProductsForVerification(user: AuthenticatedUser, status?: ProductStatus) {
  requireVerifier(user);
  const selectedStatus = status && Object.values(ProductStatus).includes(status) ? status : undefined;
  const products = await prisma.product.findMany({
    where: { deletedAt: null, ...(selectedStatus ? { status: selectedStatus } : {}) },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    include: verificationInclude,
  });
  const counts = await prisma.product.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } });
  return {
    products: products.map(serializeVerificationProduct),
    counts: Object.fromEntries(counts.map((item) => [item.status, item._count._all])),
  };
}

export async function getProductForVerification(user: AuthenticatedUser, productId: string) {
  requireVerifier(user);
  if (!/^\d+$/.test(productId)) throw new Error("PRODUCT_NOT_FOUND");
  const product = await prisma.product.findFirst({ where: { id: BigInt(productId), deletedAt: null }, include: verificationInclude });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return serializeVerificationProduct(product);
}

export async function decideProductVerification(user: AuthenticatedUser, productId: string, input: ProductVerificationInput, context: RequestContext) {
  requireVerifier(user);
  if (!/^\d+$/.test(productId)) throw new Error("PRODUCT_NOT_FOUND");
  const current = await prisma.product.findFirst({ where: { id: BigInt(productId), deletedAt: null }, include: verificationInclude });
  if (!current) throw new Error("PRODUCT_NOT_FOUND");
  if (current.status !== ProductStatus.PENDING_VERIFICATION) throw new Error("INVALID_STATUS");

  const nextStatus = input.decision === "APPROVE"
    ? ProductStatus.VERIFIED
    : input.decision === "REVISION"
      ? ProductStatus.REVISION_REQUIRED
      : ProductStatus.REJECTED;
  const notes = input.notes.trim() || null;

  const updated = await prisma.$transaction(async (transaction) => {
    const product = await transaction.product.update({
      where: { id: current.id },
      data: {
        status: nextStatus,
        verifiedById: BigInt(user.id),
        verifiedAt: new Date(),
        verificationNotes: notes,
        isPublished: false,
      },
      include: verificationInclude,
    });
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(user.id), businessId: current.businessId,
      action: input.decision === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: "PRODUCT", entityId: current.id.toString(),
      previousValue: { status: current.status },
      newValue: { status: nextStatus, notes },
      ipAddress: context.ipAddress, userAgent: context.userAgent,
    } });
    const recipients = await transaction.businessMember.findMany({
      where: { businessId: current.businessId, status: BusinessMembershipStatus.ACTIVE, deletedAt: null },
      select: { userId: true },
    });
    if (recipients.length) {
      const title = input.decision === "APPROVE" ? "Produk telah diverifikasi" : input.decision === "REVISION" ? "Produk perlu diperbaiki" : "Produk ditolak";
      const message = input.decision === "APPROVE"
        ? `Produk ${current.name} telah diverifikasi dan dapat dipublikasikan.`
        : `Produk ${current.name}: ${notes ?? "Silakan periksa kembali data produk."}`;
      await transaction.notification.createMany({ data: recipients.map(({ userId }) => ({ userId, title, message, href: "/dashboard/business/products" })) });
    }
    return product;
  });
  return serializeVerificationProduct(updated);
}

export async function getVerificationImage(user: AuthenticatedUser, productId: string, imageId: string) {
  requireVerifier(user);
  if (!/^\d+$/.test(productId) || !/^\d+$/.test(imageId)) throw new Error("IMAGE_NOT_FOUND");
  const image = await prisma.productImage.findFirst({
    where: { id: BigInt(imageId), productId: BigInt(productId), deletedAt: null, product: { deletedAt: null } },
    select: { storageKey: true, mimeType: true },
  });
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  return image;
}

function serializeVerificationProduct(product: VerificationProduct): ProductVerificationView {
  const decimal = (value: Prisma.Decimal | null) => value?.toString() ?? null;
  return {
    id: product.id.toString(), businessId: product.businessId.toString(),
    businessName: product.business.profile?.tradeName || product.business.name,
    businessCode: product.business.businessCode, businessPhone: product.business.profile?.phone ?? null,
    businessAddress: product.business.profile?.addressLine ?? null,
    sku: product.sku, name: product.name, brandName: product.brandName,
    commodityName: product.commodity.name,
    categoryName: product.category.parent ? `${product.category.parent.name} / ${product.category.name}` : product.category.name,
    unitName: product.unit.name, unitSymbol: product.unit.symbol,
    shortDescription: product.shortDescription, description: product.description,
    packaging: product.packaging, storageInstructions: product.storageInstructions, shelfLifeDays: product.shelfLifeDays,
    minimumPrice: decimal(product.minimumPrice), maximumPrice: decimal(product.maximumPrice),
    isPriceNegotiable: product.isPriceNegotiable, isPriceVisible: product.isPriceVisible,
    stockQuantity: decimal(product.stockQuantity), minimumOrderQuantity: decimal(product.minimumOrderQuantity),
    productionCapacity: decimal(product.productionCapacity), productionCapacityPeriod: product.productionCapacityPeriod,
    availability: product.availability, marketScope: product.marketScope,
    status: product.status, isPublished: product.isPublished,
    submittedAt: product.submittedAt?.toISOString() ?? null, verifiedAt: product.verifiedAt?.toISOString() ?? null,
    verificationNotes: product.verificationNotes, verifierName: product.verifiedBy?.profile?.fullName ?? null,
    updatedAt: product.updatedAt.toISOString(),
    images: product.images.map((image) => ({
      id: image.id.toString(), altText: image.altText, isPrimary: image.isPrimary,
      url: `/api/admin-dinas/products/${product.id}/images/${image.id}`,
    })),
  };
}

export function getVerificationError(error: unknown) {
  if (!(error instanceof Error)) return { status: 500, message: "Verifikasi produk belum dapat diproses." };
  const known: Record<string, { status: number; message: string }> = {
    FORBIDDEN: { status: 403, message: "Anda tidak memiliki izin untuk memverifikasi produk." },
    PRODUCT_NOT_FOUND: { status: 404, message: "Produk tidak ditemukan." },
    IMAGE_NOT_FOUND: { status: 404, message: "Gambar produk tidak ditemukan." },
    INVALID_STATUS: { status: 409, message: "Produk sudah diproses atau belum diajukan." },
  };
  return known[error.message] ?? { status: 500, message: "Verifikasi produk belum dapat diproses." };
}
