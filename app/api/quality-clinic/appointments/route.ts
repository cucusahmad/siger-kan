import { NextResponse } from "next/server";

import { createClinicAppointmentSchema } from "@/features/quality-clinic/quality-clinic.schema";
import { createClinicAppointment, getClinicAppointmentError, getClinicAppointments } from "@/features/quality-clinic/quality-clinic.service";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { getRequestContext } from "@/lib/request-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    return NextResponse.json({ success: true, message: "Jadwal Klinik Mutu berhasil dimuat.", data: await getClinicAppointments(user) });
  } catch (error: unknown) {
    return clinicFailure(error, user.id, "list");
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Sesi Anda telah berakhir.", 401);
  try {
    const parsed = createClinicAppointmentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali pengajuan jadwal Anda.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    const data = await createClinicAppointment(user, parsed.data, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Pengajuan jadwal berhasil dikirim.", data }, { status: 201 });
  } catch (error: unknown) {
    return clinicFailure(error, user.id, "create");
  }
}

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function clinicFailure(error: unknown, userId: string, operation: string) {
  const known = getClinicAppointmentError(error);
  if (known.status === 500) console.error("Quality clinic request failed", { userId, operation, error });
  return failure(known.message, known.status);
}
