export interface CatalogProductView {
  readonly id: string;
  readonly businessName: string;
  readonly name: string;
  readonly brandName: string;
  readonly commodityId: string;
  readonly commodityName: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly unitSymbol: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly packaging: string;
  readonly minimumPrice: string;
  readonly maximumPrice: string;
  readonly isPriceNegotiable: boolean;
  readonly isPriceVisible: boolean;
  readonly stockQuantity: string;
  readonly minimumOrderQuantity: string;
  readonly availability: string;
  readonly marketScope: string;
  readonly status: string;
  readonly isPublished: boolean;
  readonly canReceiveOffer: boolean;
  readonly imageUrl: string | null;
  readonly isOwnProduct: boolean;
  readonly hasSubmittedOffer: boolean;
}

export interface CatalogOption {
  readonly id: string;
  readonly label: string;
}

export interface ProductCatalogData {
  readonly businessName: string;
  readonly canOffer: boolean;
  readonly products: readonly CatalogProductView[];
  readonly commodities: readonly CatalogOption[];
  readonly categories: readonly CatalogOption[];
}
