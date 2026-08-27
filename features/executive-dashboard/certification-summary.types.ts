export interface ExecutiveCertificationRow {
  readonly id: string;
  readonly source: "SIGERKAN" | "LAMPAU";
  readonly referenceNumber: string;
  readonly businessName: string;
  readonly productName: string;
  readonly certificationType: string;
  readonly status: string;
  readonly submittedOrIssuedAt: string | null;
  readonly expiresAt: string | null;
  readonly updatedAt: string;
}

export interface CertificationSummaryData {
  readonly generatedAt: string;
  readonly rows: readonly ExecutiveCertificationRow[];
}
