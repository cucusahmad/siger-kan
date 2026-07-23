import { serveSampleShipmentEvidence } from "@/features/testing-applications/sample-shipment.service";
import { requireSampleReceptionOfficer } from "@/features/testing-applications/testing-application.auth";
import { apiError, validId } from "@/features/testing-applications/testing-api";

interface Context { readonly params: Promise<{ readonly id: string; readonly evidenceId: string }> }
export const runtime = "nodejs";

export async function GET(_request: Request, context: Context) {
  try {
    const { id, evidenceId } = await context.params;
    if (!validId(id) || !validId(evidenceId)) throw new Error("NOT_FOUND");
    await requireSampleReceptionOfficer();
    return await serveSampleShipmentEvidence(id, evidenceId);
  } catch (error: unknown) { return apiError(error); }
}
