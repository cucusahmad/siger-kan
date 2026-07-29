import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BusinessTypesPage } from "@/components/dashboard/master-data/BusinessTypesPage";
import { MasterDataPage } from "@/components/dashboard/master-data/MasterDataPage";
import { requireSuperAdminPage } from "@/features/master-data/master-data.auth";
import { getMasterData } from "@/features/master-data/master-data.service";
import { isEditableMasterResource } from "@/features/master-data/master-data.types";
import { getCurrentUser } from "@/lib/business/get-current-business";

interface PageProps {
  readonly params: Promise<{ readonly resource: string }>;
}

export const metadata: Metadata = { title: "Master Data Business Matching" };

export default async function MasterDataResourcePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  requireSuperAdminPage(user);
  const { resource } = await params;
  if (resource === "business-types") return <BusinessTypesPage />;
  if (!isEditableMasterResource(resource)) notFound();
  return <MasterDataPage resource={resource} initialData={await getMasterData(resource)} />;
}
