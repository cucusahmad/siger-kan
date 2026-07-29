export interface ExecutiveMetric {
  readonly label: string;
  readonly value: number;
  readonly detail: string;
}

export interface ExecutiveBreakdown {
  readonly label: string;
  readonly value: number;
}

export interface ExecutiveTrendPoint {
  readonly label: string;
  readonly businesses: number;
  readonly products: number;
  readonly matches: number;
}

export interface ExecutiveBusinessRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: string;
  readonly region: string;
  readonly status: string;
  readonly productCount: number;
  readonly needCount: number;
  readonly offerCount: number;
  readonly registeredAt: string;
}

export interface ExecutiveProductRow {
  readonly id: string;
  readonly name: string;
  readonly businessName: string;
  readonly commodity: string;
  readonly category: string;
  readonly marketScope: string;
  readonly status: string;
  readonly published: boolean;
  readonly offerCount: number;
}

export interface ExecutiveMatchRow {
  readonly id: string;
  readonly source: "KEBUTUHAN" | "PRODUK";
  readonly subject: string;
  readonly requester: string;
  readonly partner: string;
  readonly quantity: string;
  readonly value: string;
  readonly status: string;
  readonly submittedAt: string;
}

export interface ExecutiveTestingRow {
  readonly id: string;
  readonly applicationNumber: string;
  readonly businessName: string;
  readonly productName: string;
  readonly laboratoryName: string;
  readonly status: string;
  readonly submittedAt: string | null;
}

export interface ExecutiveDashboardData {
  readonly generatedAt: string;
  readonly metrics: readonly ExecutiveMetric[];
  readonly businessStatuses: readonly ExecutiveBreakdown[];
  readonly productStatuses: readonly ExecutiveBreakdown[];
  readonly topRegions: readonly ExecutiveBreakdown[];
  readonly topCommodities: readonly ExecutiveBreakdown[];
  readonly testingPipeline: readonly ExecutiveBreakdown[];
  readonly trend: readonly ExecutiveTrendPoint[];
  readonly businesses: readonly ExecutiveBusinessRow[];
  readonly products: readonly ExecutiveProductRow[];
  readonly matches: readonly ExecutiveMatchRow[];
  readonly testing: readonly ExecutiveTestingRow[];
}
