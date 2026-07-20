export interface AdminBusinessSummary {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly ownerName: string;
  readonly ownerEmail: string;
  readonly businessType: string;
  readonly location: string;
  readonly status: string;
  readonly commodityCount: number;
  readonly documentCount: number;
  readonly createdAt: string;
}

export interface AdminDashboardData {
  readonly statistics: {
    readonly totalBusinesses: number;
    readonly activeBusinesses: number;
    readonly pendingBusinesses: number;
    readonly totalBusinessUsers: number;
  };
  readonly businesses: readonly AdminBusinessSummary[];
}

export interface AdminBusinessDetail {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly createdAt: string;
  readonly verifiedAt: string | null;
  readonly profile: {
    readonly businessType: string;
    readonly tradeName: string | null;
    readonly legalEntityType: string | null;
    readonly businessScale: string | null;
    readonly yearEstablished: number | null;
    readonly employeeCount: number | null;
    readonly productionCapacity: string | null;
    readonly productionUnit: string | null;
    readonly picName: string | null;
    readonly picPosition: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly whatsapp: string | null;
    readonly address: string;
    readonly description: string | null;
    readonly nib: string | null;
    readonly taxNumber: string | null;
    readonly siupNumber: string | null;
    readonly pirtNumber: string | null;
    readonly halalNumber: string | null;
    readonly distributionPermitNumber: string | null;
  } | null;
  readonly members: readonly {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly phone: string | null;
    readonly role: string;
    readonly status: string;
    readonly emailVerifiedAt: string | null;
  }[];
  readonly documents: readonly BusinessDocumentDto[];
  readonly commodities: readonly {
    readonly id: string;
    readonly name: string;
    readonly scientificName: string | null;
    readonly priority: string;
    readonly description: string | null;
  }[];
}
import type { BusinessDocumentDto } from "@/components/dashboard/business/BusinessDocumentSection";
