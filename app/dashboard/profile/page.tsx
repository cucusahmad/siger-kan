import { notFound, redirect } from "next/navigation";

import { AccountProfileView } from "@/components/dashboard/profile/AccountProfileView";
import { getAccountProfile } from "@/features/account/account.service";
import { getCurrentUser } from "@/lib/business/get-current-business";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getAccountProfile(user.id);
  if (!profile) notFound();
  return <AccountProfileView profile={profile} />;
}
