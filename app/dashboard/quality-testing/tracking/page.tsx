import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LaboratoryTracking } from "@/components/dashboard/testing-applications/LaboratoryTracking";
import { requireApplicant } from "@/features/testing-applications/testing-application.auth";
import { listLaboratoryTracking } from "@/features/testing-applications/laboratory-tracking.service";

export const metadata: Metadata = { title: "Tracking Proses Laboratorium" };

export default async function LaboratoryTrackingPage() {
  let businessId: bigint;
  try {
    const { membership } = await requireApplicant("read");
    businessId = membership.businessId;
  } catch {
    redirect("/dashboard");
  }
  const applications = await listLaboratoryTracking(businessId);
  return <LaboratoryTracking applications={applications} />;
}
