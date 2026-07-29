import type { ProductInput } from "./product.schema";

export interface ProductImageView {
  readonly id: string;
  readonly altText: string | null;
  readonly isPrimary: boolean;
  readonly url: string;
}

export interface ProductView extends ProductInput {
  readonly id: string;
  readonly commodityName: string;
  readonly categoryName: string;
  readonly unitName: string;
  readonly unitSymbol: string;
  readonly status: "DRAFT" | "PENDING_VERIFICATION" | "REVISION_REQUIRED" | "VERIFIED" | "REJECTED" | "INACTIVE";
  readonly isPublished: boolean;
  readonly verificationNotes: string | null;
  readonly updatedAt: string;
  readonly images: readonly ProductImageView[];
}

export interface ProductOption {
  readonly id: string;
  readonly label: string;
}

export interface ProductPageData {
  readonly businessName: string;
  readonly canEdit: boolean;
  readonly products: readonly ProductView[];
  readonly options: {
    readonly commodities: readonly ProductOption[];
    readonly categories: readonly ProductOption[];
    readonly units: readonly ProductOption[];
  };
}

