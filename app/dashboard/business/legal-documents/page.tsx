import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { BusinessLegalDocumentsPage } from "@/components/dashboard/business/BusinessLegalDocumentsPage";
import { editableBusinessRoles, getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { listBusinessDocuments } from "@/lib/business-documents/document-service";

export const metadata: Metadata = { title: "Legalitas Usaha" };

export default async function LegalDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.permissions.includes("business.document.read")) {
    return (
      <section className="rounded-3xl border border-[#E63946]/20 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-navy">Akses tidak tersedia</h1>
        <p className="mt-2 text-sm text-muted">Akun Anda tidak memiliki izin untuk melihat legalitas usaha.</p>
      </section>
    );
  }

  const membership = await resolveCurrentBusiness(user.id);
  if (!membership) {
    return (
      <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-ocean/25 bg-white p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-seafoam text-ocean"><Building2 className="h-7 w-7" /></span>
        <h1 className="mt-5 text-xl font-bold text-navy">Belum ada usaha terhubung</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">Hubungkan akun dengan usaha aktif untuk mengelola dokumen legalitas.</p>
        <Link href="/dashboard" className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Kembali ke Dashboard</Link>
      </section>
    );
  }

  const canManage = user.permissions.includes("business.document.upload") && editableBusinessRoles.has(membership.role);
  const documents = await listBusinessDocuments(user.id, canManage);

  return <BusinessLegalDocumentsPage businessName={membership.business.name} initialDocuments={documents} canManage={canManage} />;
}
