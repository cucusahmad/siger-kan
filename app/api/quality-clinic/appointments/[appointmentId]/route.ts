import { NextResponse } from "next/server";

import { updateClinicAppointmentSchema } from "@/features/quality-clinic/quality-clinic.schema";
import { getClinicAppointmentError, updateClinicAppointment } from "@/features/quality-clinic/quality-clinic.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext { readonly params: Promise<{ readonly appointmentId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const parsed = updateClinicAppointmentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, message: "Data pembaruan jadwal tidak valid.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const { appointmentId } = await context.params;
    const data = await updateClinicAppointment(user, appointmentId, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Jadwal Klinik Mutu berhasil diperbarui.", data });
  } catch (error: unknown) {
    const known = getClinicAppointmentError(error);
    if (known.status === 500) console.error("Quality clinic update failed", { userId: user.id, error });
    return failure(known.message, known.status);
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}
