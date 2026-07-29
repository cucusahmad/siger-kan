import type {
  ProductAvailability,
  ProductMarketScope,
  ProductStatus,
  ProductionCapacityPeriod,
} from "@/app/generated/prisma/client";

export interface ProductVerificationImage {
  readonly id: string;
  readonly altText: string | null;
  readonly isPrimary: boolean;
  readonly url: string;
}

export interface ProductVerificationView {
  readonly id: string;
  readonly businessId: string;
  readonly businessName: string;
  readonly businessCode: string;
  readonly businessPhone: string | null;
  readonly businessAddress: string | null;
  readonly sku: string | null;
  readonly name: string;
  readonly brandName: string | null;
  readonly commodityName: string;
  readonly categoryName: string;
  readonly unitName: string;
  readonly unitSymbol: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly packaging: string | null;
  readonly storageInstructions: string | null;
  readonly shelfLifeDays: number | null;
  readonly minimumPrice: string | null;
  readonly maximumPrice: string | null;
  readonly isPriceNegotiable: boolean;
  readonly isPriceVisible: boolean;
  readonly stockQuantity: string | null;
  readonly minimumOrderQuantity: string | null;
  readonly productionCapacity: string | null;
  readonly productionCapacityPeriod: ProductionCapacityPeriod | null;
  readonly availability: ProductAvailability;
  readonly marketScope: ProductMarketScope;
  readonly status: ProductStatus;
  readonly isPublished: boolean;
  readonly submittedAt: string | null;
  readonly verifiedAt: string | null;
  readonly verificationNotes: string | null;
  readonly verifierName: string | null;
  readonly updatedAt: string;
  readonly images: readonly ProductVerificationImage[];
}

