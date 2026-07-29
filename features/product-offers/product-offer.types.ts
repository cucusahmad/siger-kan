export interface ProductOfferCounterparty {
  readonly businessName: string;
  readonly address: string;
  readonly email: string;
  readonly whatsapp: string;
}

export interface ProductOfferView {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly counterpartyName: string;
  readonly quantity: string;
  readonly unitSymbol: string;
  readonly unitPrice: string;
  readonly deliveryAddress: string;
  readonly validUntil: string;
  readonly message: string;
  readonly status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  readonly submittedAt: string;
  readonly responseNotes: string;
  readonly direction: "OUTGOING" | "INCOMING";
  readonly counterparty: ProductOfferCounterparty | null;
}

export interface ProductOfferPageData {
  readonly businessName: string;
  readonly offers: readonly ProductOfferView[];
}
