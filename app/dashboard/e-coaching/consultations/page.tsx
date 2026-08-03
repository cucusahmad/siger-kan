import { redirect } from "next/navigation";

import { ECoachingWorkspace } from "@/components/dashboard/e-coaching/ECoachingWorkspace";
import { getConsultations } from "@/features/e-coaching/e-coaching.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export default async function ECoachingConsultationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const hasAccess = user.roleCodes.some((role) => role === "PELAKU_USAHA" || role === "KONSULTAN_MUTU");
  if (!hasAccess) redirect("/dashboard");

  return <ECoachingWorkspace initialData={await getConsultations(user)} />;
}
