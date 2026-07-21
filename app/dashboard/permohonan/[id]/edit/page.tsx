import { ApplicationWizard } from "@/components/dashboard/testing-applications/ApplicationWizard";
import { getApplication } from "@/features/testing-applications/testing-application.service";
import { getCurrentUser, resolveCurrentBusiness } from "@/lib/business/get-current-business";
import { notFound, redirect } from "next/navigation";

interface PageProps { readonly params: Promise<{ readonly id: string }> }
interface Detail { readonly status: string; readonly laboratoryId: string | null; readonly purpose: string | null; readonly otherPurpose: string | null; readonly testingTypes: string[]; readonly notes: string | null; readonly declarationAccepted: boolean; readonly product: Record<string, string | null> | null; readonly samples: readonly Record<string, unknown>[]; readonly parameters: readonly { readonly testingSampleId: string; readonly testingParameterId: string }[]; readonly documents: readonly { readonly id: string; readonly documentType: string; readonly documentName: string | null; readonly fileName: string; readonly mimeType: string; readonly fileSize: string; readonly uploadedAt: string }[] }

export default async function EditApplicationPage({ params }: PageProps) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const membership = await resolveCurrentBusiness(user.id); if (!membership) redirect("/dashboard/permohonan");
  const { id } = await params; if (!/^\d+$/.test(id)) notFound();
  let detail: Detail; try { detail = await getApplication({ userId: user.id, businessId: membership.businessId }, id) as Detail; } catch { notFound(); }
  if (detail.status !== "DRAFT" && detail.status !== "PERLU_PERBAIKAN") redirect(`/dashboard/permohonan/${id}`);
  const sampleIndex = new Map(detail.samples.map((sample, index) => [String(sample.id), index]));
  const initialData = { laboratoryId: detail.laboratoryId ?? "", purpose: detail.purpose ?? "", otherPurpose: detail.otherPurpose ?? "", testingTypes: detail.testingTypes, notes: detail.notes ?? "", declarationAccepted: detail.declarationAccepted, product: detail.product ? { productName: detail.product.productName ?? "", productType: detail.product.productType ?? "", hsCode: detail.product.hsCode ?? "", productForm: detail.product.productForm ?? "", otherProductForm: detail.product.otherProductForm ?? "", description: detail.product.description ?? "" } : undefined, samples: detail.samples.map((sample) => ({ ...sample, id: String(sample.id), samplingDate: String(sample.samplingDate ?? "").slice(0, 10), quantity: Number(sample.quantity ?? 1), weight: Number(sample.weight ?? 1), temperature: sample.temperature === null ? undefined : Number(sample.temperature) })) as never, parameters: detail.parameters.map((item) => ({ parameterId: item.testingParameterId, sampleIndex: sampleIndex.get(item.testingSampleId) })) };
  return <ApplicationWizard applicationId={id} initialData={initialData as never} initialDocuments={detail.documents}/>;
}
