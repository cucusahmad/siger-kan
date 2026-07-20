import { LegalDocumentType } from "@/app/generated/prisma/client";

export const businessDocumentTypes = [
  LegalDocumentType.NIB,
  LegalDocumentType.TAX_ID,
  LegalDocumentType.BUSINESS_LICENSE,
  LegalDocumentType.PIRT,
  LegalDocumentType.HALAL_CERTIFICATE,
  LegalDocumentType.QUALITY_CERTIFICATE,
  LegalDocumentType.PIC_IDENTITY,
  LegalDocumentType.OTHER,
] as const;

export const businessDocumentTypeLabels: Readonly<Record<(typeof businessDocumentTypes)[number], string>> = {
  NIB: "Nomor Induk Berusaha",
  TAX_ID: "NPWP",
  BUSINESS_LICENSE: "SIUP / Izin Usaha",
  PIRT: "PIRT",
  HALAL_CERTIFICATE: "Sertifikat Halal",
  QUALITY_CERTIFICATE: "Sertifikat Mutu",
  PIC_IDENTITY: "Identitas Penanggung Jawab",
  OTHER: "Dokumen Lainnya",
};

export const singleDocumentTypes = new Set<LegalDocumentType>([
  LegalDocumentType.NIB,
  LegalDocumentType.TAX_ID,
  LegalDocumentType.BUSINESS_LICENSE,
  LegalDocumentType.PIRT,
  LegalDocumentType.HALAL_CERTIFICATE,
  LegalDocumentType.PIC_IDENTITY,
]);

export function isBusinessDocumentType(value: string): value is (typeof businessDocumentTypes)[number] {
  return businessDocumentTypes.includes(value as (typeof businessDocumentTypes)[number]);
}

export function getDocumentDisplayName(type: LegalDocumentType, customTitle: string | null): string {
  if (type === LegalDocumentType.OTHER && customTitle) return customTitle;
  return businessDocumentTypeLabels[type as keyof typeof businessDocumentTypeLabels] ?? type;
}
