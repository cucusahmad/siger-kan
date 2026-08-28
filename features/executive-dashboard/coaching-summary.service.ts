import { prisma } from "@/lib/prisma";

import { CoachingActivityType, type CoachingActivityRow, type CoachingSummaryData } from "./coaching-summary.types";

export async function getCoachingSummaryData(): Promise<CoachingSummaryData> {
  const [appointments, consultations] = await Promise.all([
    prisma.qualityClinicAppointment.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, topic: true, description: true, status: true, createdAt: true,
        scheduledAt: true, preferredAt: true, location: true, consultantNote: true,
        business: { select: { name: true, profile: { select: { tradeName: true } } } },
        requester: { select: { profile: { select: { fullName: true } } } },
        consultant: { select: { profile: { select: { fullName: true } } } },
      },
    }),
    prisma.qualityConsultation.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, subject: true, question: true, category: true, status: true, createdAt: true,
        business: { select: { name: true, profile: { select: { tradeName: true } } } },
        requester: { select: { profile: { select: { fullName: true } } } },
        consultant: { select: { profile: { select: { fullName: true } } } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const activities: CoachingActivityRow[] = [
    ...appointments.map((item) => ({
      id: `clinic-${item.id.toString()}`, type: CoachingActivityType.QUALITY_CLINIC,
      title: item.topic, businessName: item.business.profile?.tradeName || item.business.name,
      requesterName: item.requester.profile?.fullName ?? "Pelaku Usaha",
      consultantName: item.consultant?.profile?.fullName ?? null, status: item.status,
      createdAt: item.createdAt.toISOString(), scheduledAt: (item.scheduledAt ?? item.preferredAt).toISOString(),
      location: item.location, category: null, description: item.description,
      consultantNote: item.consultantNote, responseCount: 0,
    })),
    ...consultations.map((item) => ({
      id: `consultation-${item.id.toString()}`, type: CoachingActivityType.ONLINE_CONSULTATION,
      title: item.subject, businessName: item.business.profile?.tradeName || item.business.name,
      requesterName: item.requester.profile?.fullName ?? "Pelaku Usaha",
      consultantName: item.consultant?.profile?.fullName ?? null, status: item.status,
      createdAt: item.createdAt.toISOString(), scheduledAt: null, location: null,
      category: item.category, description: item.question, consultantNote: null,
      responseCount: item._count.messages,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { generatedAt: new Date().toISOString(), activities };
}
