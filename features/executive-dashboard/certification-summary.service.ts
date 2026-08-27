import { prisma } from "@/lib/prisma";

import type { CertificationSummaryData, ExecutiveCertificationRow } from "./certification-summary.types";

function getProductName(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Belum diisi";
  const productName = Reflect.get(value, "productName");
  return typeof productName === "string" && productName.trim() ? productName : "Belum diisi";
}

function getPastReference(item: { readonly spptSniNumber: string | null; readonly skpNumber: string | null; readonly sniNumber: string | null }): string {
  return item.spptSniNumber ?? item.skpNumber ?? item.sniNumber ?? "Tanpa nomor";
}

export async function getCertificationSummaryData(): Promise<CertificationSummaryData> {
  const [applications, pastCertifications] = await Promise.all([
    prisma.certificationApplication.findMany({
      where: { deletedAt: null, status: { not: "DRAFT" } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, applicationNumber: true, type: true, status: true, productInformation: true,
        submittedAt: true, updatedAt: true, business: { select: { name: true } },
      },
    }),
    prisma.pastCertification.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, productName: true, sniNumber: true, spptSniNumber: true, skpNumber: true,
        certificationStatus: true, spptIssuedAt: true, spptExpiresAt: true, updatedAt: true,
        business: { select: { name: true } },
      },
    }),
  ]);

  const rows: ExecutiveCertificationRow[] = [
    ...applications.map((item) => ({
      id: `sigerkan-${item.id.toString()}`,
      source: "SIGERKAN" as const,
      referenceNumber: item.applicationNumber ?? "Tanpa nomor",
      businessName: item.business.name,
      productName: getProductName(item.productInformation),
      certificationType: item.type,
      status: item.status,
      submittedOrIssuedAt: item.submittedAt?.toISOString() ?? null,
      expiresAt: null,
      updatedAt: item.updatedAt.toISOString(),
    })),
    ...pastCertifications.map((item) => ({
      id: `lampau-${item.id.toString()}`,
      source: "LAMPAU" as const,
      referenceNumber: getPastReference(item),
      businessName: item.business.name,
      productName: item.productName,
      certificationType: "SERTIFIKASI_LAMPAU",
      status: item.certificationStatus,
      submittedOrIssuedAt: item.spptIssuedAt?.toISOString() ?? null,
      expiresAt: item.spptExpiresAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { generatedAt: new Date().toISOString(), rows };
}
