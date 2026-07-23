import { AuditAction } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { sampleReviewSchema } from "./testing-application.schema";

export async function reviewAcceptedSample(userId: string, applicationId: string, payload: unknown, context: RequestContext) {
  const parsed = sampleReviewSchema.safeParse(payload);
  if (!parsed.success) throw new Error("INVALID_REVIEW");

  return prisma.$transaction(async (transaction) => {
    const application = await transaction.testingApplication.findFirst({
      where: { id: BigInt(applicationId), status: "KAJI_ULANG", deletedAt: null, sampleReview: null },
      select: { id: true, status: true, applicationNumber: true, parameters: { select: { id: true } }, businessProfile: { select: { businessId: true } } },
    });
    if (!application) throw new Error("INVALID_STATUS");

    const review = await transaction.sampleReview.create({
      data: {
        testingApplicationId: application.id,
        personnelReady: parsed.data.personnelReady,
        equipmentReady: parsed.data.equipmentReady,
        methodAvailable: parsed.data.methodAvailable,
        laboratoryCapable: parsed.data.laboratoryCapable,
        subcontractRequired: parsed.data.subcontractRequired,
        decision: parsed.data.parameters.some((item) => item.decision === "SUBKONTRAK") ? "SUBKONTRAK" : "DAPAT_DIUJI_INTERNAL",
        notes: parsed.data.notes || null,
        reviewedById: BigInt(userId),
      },
    });

    const expectedParameterIds = new Set(application.parameters.map(({ id }) => id.toString()));
    const submittedParameterIds = new Set(parsed.data.parameters.map(({ applicationParameterId }) => applicationParameterId));
    if (expectedParameterIds.size !== submittedParameterIds.size || [...expectedParameterIds].some((id) => !submittedParameterIds.has(id))) throw new Error("INVALID_REVIEW");

    for (const item of parsed.data.parameters) {
      const applicationParameterId = BigInt(item.applicationParameterId);
      await transaction.sampleReviewParameter.create({ data: { sampleReviewId: review.id, applicationTestingParameterId: applicationParameterId, decision: item.decision, notes: item.notes || null } });
      const isInternal = item.decision === "DAPAT_DIUJI_INTERNAL";
      await transaction.testingWorkOrder.create({ data: {
        workOrderNumber: `WO-${application.applicationNumber ?? application.id.toString()}-${applicationParameterId.toString()}`,
        testingApplicationId: application.id,
        applicationTestingParameterId: applicationParameterId,
        type: isInternal ? "INTERNAL" : "SUBCONTRACT",
        status: isInternal ? "MENUNGGU_PENUGASAN_ANALIS" : "MENUNGGU_PENGIRIMAN_LAB_MITRA",
      } });
    }

    await transaction.testingApplication.update({ where: { id: application.id }, data: { status: "DALAM_PENGUJIAN" } });

    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(userId),
      businessId: application.businessProfile.businessId,
      action: AuditAction.APPROVE,
      entityType: "SAMPLE_REVIEW",
      entityId: review.id.toString(),
      previousValue: { status: application.status },
      newValue: { status: "DALAM_PENGUJIAN", decision: review.decision, workOrderCount: parsed.data.parameters.length },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    } });

    return { id: review.id.toString(), decision: review.decision };
  });
}
