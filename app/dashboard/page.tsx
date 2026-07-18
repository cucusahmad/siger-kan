import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { getAuthenticatedUser } from "@/features/auth/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export const metadata: Metadata = { title: "Dashboard | SIGER-KAN" };

export default async function DashboardPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await getAuthenticatedUser(token) : null;

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f5f9f8] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Image src="/siger-kan-mark.svg" alt="" width={42} height={42} priority /><strong className="text-lg text-navy">SIGER-KAN</strong></div>
          <LogoutButton />
        </header>
        <section className="mt-12 rounded-[2rem] border border-white bg-white p-7 shadow-[0_24px_70px_rgba(7,59,76,.1)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-ocean">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-.04em] text-navy">Selamat Datang</h1>
          <dl className="mt-8 grid gap-5 sm:grid-cols-3">
            <div><dt className="text-xs font-bold uppercase tracking-wider text-muted">Nama User</dt><dd className="mt-2 font-semibold text-navy">{user.fullName}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wider text-muted">Role</dt><dd className="mt-2 font-semibold text-navy">{user.roles.join(", ") || "-"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wider text-muted">Business</dt><dd className="mt-2 font-semibold text-navy">{user.businessName ?? "-"}</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}
