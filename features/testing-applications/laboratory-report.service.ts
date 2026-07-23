import { AuditAction, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { decideLaboratoryReportSchema, submitLaboratoryReportSchema } from "./laboratory-report.schema";

function serialize(value: unknown): unknown { return JSON.parse(JSON.stringify(value, (_key, item: unknown) => typeof item === "bigint" ? item.toString() : item)); }

const reportSelect = {
  id: true,
  reportNumber: true,
  status: true,
  reportDate: true,
  conclusion: true,
  notes: true,
  submittedAt: true,
  approvedAt: true,
  approvalNotes: true,
  finalFileName: true,
  finalFileSize: true,
  finalUploadedAt: true,
  publishedAt: true,
  preparedBy: { select: { profile: { select: { fullName: true } } } },
  approvedBy: { select: { profile: { select: { fullName: true, positionTitle: true } } } },
  application: {
    select: {
      id: true,
      applicationNumber: true,
      purpose: true,
      businessProfile: { select: { business: { select: { name: true } } } },
      laboratory: { select: { name: true, address: true } },
      product: { select: { productName: true } },
      workOrders: {
        where: { deletedAt: null },
        orderBy: { id: "asc" },
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          testingMethod: true,
          supervisorNotes: true,
          applicationParameter: { select: { parameter: { select: { name: true, method: true } }, sample: { select: { sampleName: true } } } },
          documents: { where: { deletedAt: null }, select: { id: true, type: true, fileName: true } },
        },
      },
    },
  },
} as const;

export async function listLaboratoryReports(role: "PREPARER" | "APPROVER") {
  if (role === "APPROVER") return serialize(await prisma.laboratoryTestReport.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { submittedAt: "asc" }], select: reportSelect }));
  const applications = await prisma.testingApplication.findMany({
    where: { deletedAt: null, workOrders: { some: { deletedAt: null }, none: { deletedAt: null, status: { not: "HASIL_TERVERIFIKASI" } } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, applicationNumber: true, businessProfile: { select: { business: { select: { name: true } } } }, workOrders: { where: { deletedAt: null }, select: { id: true } }, laboratoryReport: { select: { id: true, reportNumber: true, status: true, reportDate: true, conclusion: true, notes: true, submittedAt: true, approvalNotes: true } } },
  });
  return serialize(applications);
}

export async function getLaboratoryReport(id: string) {
  const report = await prisma.laboratoryTestReport.findFirst({ where: { id: BigInt(id), deletedAt: null }, select: reportSelect });
  if (!report) throw new Error("NOT_FOUND");
  return serialize(report);
}

export async function submitLaboratoryReport(userId: string, payload: unknown, context: RequestContext) {
  const parsed = submitLaboratoryReportSchema.safeParse(payload);
  if (!parsed.success) throw new Error("INVALID_REPORT");
  const applicationId = BigInt(parsed.data.testingApplicationId);
  try {
    return serialize(await prisma.$transaction(async (transaction) => {
      const application = await transaction.testingApplication.findFirst({ where: { id: applicationId, deletedAt: null }, select: { id: true, workOrders: { where: { deletedAt: null }, select: { status: true } }, laboratoryReport: { select: { id: true, status: true } } } });
      if (!application) throw new Error("NOT_FOUND");
      if (!application.workOrders.length || application.workOrders.some(({ status }) => status !== "HASIL_TERVERIFIKASI")) throw new Error("WORK_ORDERS_INCOMPLETE");
      if (application.laboratoryReport && !["DRAF", "PERLU_PERBAIKAN"].includes(application.laboratoryReport.status)) throw new Error("INVALID_STATUS");
      const now = new Date();
      const data = { reportNumber: parsed.data.reportNumber, reportDate: new Date(`${parsed.data.reportDate}T00:00:00.000Z`), conclusion: parsed.data.conclusion, notes: parsed.data.notes || null, status: "MENUNGGU_PERSETUJUAN" as const, submittedAt: now, preparedById: BigInt(userId), approvedById: null, approvedAt: null, approvalNotes: null, publishedAt: null };
      const report = application.laboratoryReport
        ? await transaction.laboratoryTestReport.update({ where: { id: application.laboratoryReport.id }, data, select: reportSelect })
        : await transaction.laboratoryTestReport.create({ data: { testingApplicationId: application.id, ...data }, select: reportSelect });
      await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: AuditAction.STATUS_CHANGE, entityType: "LABORATORY_TEST_REPORT", entityId: report.id.toString(), previousValue: application.laboratoryReport ? { status: application.laboratoryReport.status } : Prisma.JsonNull, newValue: { status: "MENUNGGU_PERSETUJUAN", reportNumber: report.reportNumber }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
      return report;
    }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("REPORT_NUMBER_EXISTS");
    throw error;
  }
}

export async function decideLaboratoryReport(userId: string, id: string, payload: unknown, context: RequestContext) {
  const parsed = decideLaboratoryReportSchema.safeParse(payload);
  if (!parsed.success) throw new Error("INVALID_REPORT_DECISION");
  return serialize(await prisma.$transaction(async (transaction) => {
    const current = await transaction.laboratoryTestReport.findFirst({ where: { id: BigInt(id), status: "MENUNGGU_PERSETUJUAN", deletedAt: null }, select: { id: true, status: true, preparedById: true } });
    if (!current) throw new Error("INVALID_STATUS");
    const approved = parsed.data.decision === "SETUJUI";
    const now = new Date();
    const status = approved ? "MENUNGGU_DOKUMEN_FINAL" : "PERLU_PERBAIKAN";
    const report = await transaction.laboratoryTestReport.update({ where: { id: current.id }, data: { status, approvedById: BigInt(userId), approvedAt: now, approvalNotes: parsed.data.notes || null, publishedAt: null }, select: reportSelect });
    await transaction.notification.create({ data: { userId: current.preparedById, title: approved ? "LHU telah disetujui" : "LHU perlu diperbaiki", message: approved ? `Unggah dokumen final LHU ${report.reportNumber} untuk menerbitkannya.` : parsed.data.notes, href: `/dashboard/quality-testing/reports/${id}` } });
    await transaction.auditLog.create({ data: { actorUserId: BigInt(userId), action: approved ? AuditAction.APPROVE : AuditAction.REJECT, entityType: "LABORATORY_TEST_REPORT", entityId: current.id.toString(), previousValue: { status: current.status }, newValue: { status, notes: parsed.data.notes }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return report;
  }));
}
