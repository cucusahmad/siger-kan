export type BusinessOfferStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface BusinessOfferCounterparty {
  readonly businessName: string;
  readonly address: string;
  readonly email: string;
  readonly whatsapp: string;
}

export interface BusinessOfferView {
  readonly id: string;
  readonly businessNeedId: string;
  readonly needTitle: string;
  readonly counterpartyName: string;
  readonly quantity: string;
  readonly unitSymbol: string;
  readonly unitPrice: string;
  readonly leadTimeDays: number;
  readonly validUntil: string;
  readonly message: string;
  readonly status: BusinessOfferStatus;
  readonly submittedAt: string;
  readonly responseNotes: string;
  readonly direction: "OUTGOING" | "INCOMING";
  readonly counterparty: BusinessOfferCounterparty | null;
}
