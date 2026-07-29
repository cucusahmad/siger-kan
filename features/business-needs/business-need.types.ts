import type { BusinessNeedInput } from "./business-need.schema";
import type { BusinessOfferView } from "@/features/business-offers/business-offer.types";

export interface BusinessNeedOption {
  readonly id: string;
  readonly label: string;
}

export interface BusinessNeedView extends BusinessNeedInput {
  readonly id: string;
  readonly commodityName: string;
  readonly categoryName: string;
  readonly unitName: string;
  readonly unitSymbol: string;
  readonly status: "DRAFT" | "PUBLISHED" | "CLOSED";
  readonly publishedAt: string | null;
  readonly updatedAt: string;
}

export interface BusinessOpportunityView extends BusinessNeedView {
  readonly businessName: string;
  readonly businessLocation: string;
}

export interface BusinessNeedPageData {
  readonly businessName: string;
  readonly canEdit: boolean;
  readonly needs: readonly BusinessNeedView[];
  readonly opportunities: readonly BusinessOpportunityView[];
  readonly offers: readonly BusinessOfferView[];
  readonly options: {
    readonly commodities: readonly BusinessNeedOption[];
    readonly categories: readonly BusinessNeedOption[];
    readonly units: readonly BusinessNeedOption[];
  };
}
