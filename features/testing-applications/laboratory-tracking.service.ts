import { prisma } from "@/lib/prisma";

export interface LaboratoryTrackingWorkOrder {
  readonly id: string;
  readonly number: string;
  readonly type: string;
  readonly status: string;
  readonly sampleName: string;
  readonly parameterName: string;
  readonly analystName: string | null;
  readonly supervisorName: string | null;
  readonly assignedAt: string | null;
  readonly targetCompletionDate: string | null;
  readonly sentToSupervisorAt: string | null;
  readonly documentCount: number;
}

export interface LaboratoryTrackingApplication {
  readonly id: string;
  readonly applicationNumber: string;
  readonly status: string;
  readonly productName: string;
  readonly laboratoryName: string;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
  readonly approvedAt: string | null;
  readonly shippedAt: string | null;
  readonly sampleReviewedAt: string | null;
  readonly updatedAt: string;
  readonly sampleCount: number;
  readonly parameterCount: number;
  readonly workOrders: readonly LaboratoryTrackingWorkOrder[];
}

export async function listLaboratoryTracking(
  businessId: bigint,
): Promise<readonly LaboratoryTrackingApplication[]> {
  const applications = await prisma.testingApplication.findMany({
    where: {
      businessProfile: { businessId, deletedAt: null },
      applicationNumber: { not: null },
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      applicationNumber: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      approvedAt: true,
      updatedAt: true,
      laboratory: { select: { name: true } },
      product: { select: { productName: true } },
      sampleShipment: { select: { shippingDate: true } },
      sampleReview: { select: { reviewedAt: true } },
      _count: { select: { samples: { where: { deletedAt: null } }, parameters: true } },
      workOrders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          workOrderNumber: true,
          type: true,
          status: true,
          assignedAt: true,
          targetCompletionDate: true,
          sentToSupervisorAt: true,
          applicationParameter: {
            select: {
              sample: { select: { sampleName: true } },
              parameter: { select: { name: true } },
            },
          },
          analyst: { select: { profile: { select: { fullName: true } } } },
          assignedBy: { select: { profile: { select: { fullName: true } } } },
          _count: { select: { documents: { where: { deletedAt: null } } } },
        },
      },
    },
  });

  return applications.map((application) => ({
    id: application.id.toString(),
    applicationNumber: application.applicationNumber ?? "-",
    status: application.status,
    productName: application.product?.productName || "Produk belum diberi nama",
    laboratoryName: application.laboratory?.name || "Laboratorium belum ditentukan",
    submittedAt: application.submittedAt?.toISOString() ?? null,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    approvedAt: application.approvedAt?.toISOString() ?? null,
    shippedAt: application.sampleShipment?.shippingDate.toISOString() ?? null,
    sampleReviewedAt: application.sampleReview?.reviewedAt.toISOString() ?? null,
    updatedAt: application.updatedAt.toISOString(),
    sampleCount: application._count.samples,
    parameterCount: application._count.parameters,
    workOrders: application.workOrders.map((workOrder) => ({
      id: workOrder.id.toString(),
      number: workOrder.workOrderNumber,
      type: workOrder.type,
      status: workOrder.status,
      sampleName: workOrder.applicationParameter.sample.sampleName || "Sampel tanpa nama",
      parameterName: workOrder.applicationParameter.parameter.name,
      analystName: workOrder.analyst?.profile?.fullName ?? null,
      supervisorName: workOrder.assignedBy?.profile?.fullName ?? null,
      assignedAt: workOrder.assignedAt?.toISOString() ?? null,
      targetCompletionDate: workOrder.targetCompletionDate?.toISOString() ?? null,
      sentToSupervisorAt: workOrder.sentToSupervisorAt?.toISOString() ?? null,
      documentCount: workOrder._count.documents,
    })),
  }));
}
