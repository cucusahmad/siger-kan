import { prisma } from "@/lib/prisma";

function toIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export interface ExecutiveTestingReportItem {
  readonly id: string;
  readonly applicationNumber: string;
  readonly businessName: string;
  readonly productName: string;
  readonly laboratoryName: string;
  readonly status: string;
  readonly submittedAt: string | null;
  readonly updatedAt: string;
  readonly sampleCount: number;
  readonly parameterCount: number;
  readonly documentCount: number;
  readonly completedWorkOrderCount: number;
  readonly workOrderCount: number;
  readonly reportNumber: string | null;
  readonly reportStatus: string | null;
}

const detailSelect = {
  id: true,
  applicationNumber: true,
  status: true,
  purpose: true,
  otherPurpose: true,
  testingTypes: true,
  notes: true,
  submittedAt: true,
  reviewedAt: true,
  approvedAt: true,
  updatedAt: true,
  businessProfile: {
    select: {
      business: { select: { name: true, businessCode: true } },
      addressLine: true,
      whatsapp: true,
      picName: true,
    },
  },
  laboratory: { select: { name: true, address: true } },
  product: { select: { productName: true, productType: true, hsCode: true, productForm: true, description: true } },
  samples: {
    where: { deletedAt: null },
    orderBy: { id: "asc" as const },
    select: { id: true, sampleName: true, quantity: true, weight: true, weightUnit: true, packaging: true, condition: true, samplingDate: true, samplingLocation: true, temperature: true, description: true },
  },
  parameters: {
    orderBy: { id: "asc" as const },
    select: { id: true, parameter: { select: { name: true, method: true } }, sample: { select: { sampleName: true } } },
  },
  documents: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    select: { id: true, documentType: true, documentName: true, fileName: true, mimeType: true, fileSize: true, uploadedAt: true },
  },
  sampleShipment: {
    select: { shippingDate: true, shippingMethod: true, carrierName: true, trackingNumber: true, packageCount: true, conditionNotes: true, senderName: true },
  },
  sampleReview: { select: { decision: true, notes: true, reviewedAt: true } },
  workOrders: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true, workOrderNumber: true, type: true, status: true, testingMethod: true, assignedAt: true, targetCompletionDate: true, sentToSupervisorAt: true, reviewedAt: true, analystNotes: true, supervisorNotes: true,
      applicationParameter: { select: { parameter: { select: { name: true, method: true } }, sample: { select: { sampleName: true } } } },
      analyst: { select: { profile: { select: { fullName: true } } } },
      assignedBy: { select: { profile: { select: { fullName: true } } } },
      documents: { where: { deletedAt: null }, select: { id: true, type: true, fileName: true, mimeType: true, fileSize: true, uploadedAt: true } },
    },
  },
  laboratoryReport: { select: { id: true, reportNumber: true, status: true, reportDate: true, conclusion: true, notes: true, submittedAt: true, approvedAt: true, finalFileName: true, publishedAt: true } },
} as const;

export async function listExecutiveTestingReports(): Promise<readonly ExecutiveTestingReportItem[]> {
  const applications = await prisma.testingApplication.findMany({
    where: { deletedAt: null, applicationNumber: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, applicationNumber: true, status: true, submittedAt: true, updatedAt: true,
      businessProfile: { select: { business: { select: { name: true } } } },
      product: { select: { productName: true } },
      laboratory: { select: { name: true } },
      documents: { where: { deletedAt: null }, select: { id: true } },
      samples: { where: { deletedAt: null }, select: { id: true } },
      parameters: { select: { id: true } },
      workOrders: { where: { deletedAt: null }, select: { status: true } },
      laboratoryReport: { select: { reportNumber: true, status: true } },
    },
  });
  return applications.map((item) => ({
    id: item.id.toString(),
    applicationNumber: item.applicationNumber ?? "-",
    businessName: item.businessProfile.business.name,
    productName: item.product?.productName || "Produk belum diberi nama",
    laboratoryName: item.laboratory?.name || "Belum ditentukan",
    status: item.status,
    submittedAt: toIso(item.submittedAt),
    updatedAt: item.updatedAt.toISOString(),
    sampleCount: item.samples.length,
    parameterCount: item.parameters.length,
    documentCount: item.documents.length,
    completedWorkOrderCount: item.workOrders.filter(({ status }) => status === "HASIL_TERVERIFIKASI").length,
    workOrderCount: item.workOrders.length,
    reportNumber: item.laboratoryReport?.reportNumber ?? null,
    reportStatus: item.laboratoryReport?.status ?? null,
  }));
}

export async function getExecutiveTestingReport(id: string) {
  const item = await prisma.testingApplication.findFirst({ where: { id: BigInt(id), deletedAt: null, applicationNumber: { not: null } }, select: detailSelect });
  if (!item) throw new Error("NOT_FOUND");
  return JSON.parse(JSON.stringify(item, (_key, value: unknown) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    return value;
  })) as unknown;
}
