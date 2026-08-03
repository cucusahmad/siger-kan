import { NextResponse } from "next/server";
import { certificationError } from "./certification-application.auth";

export function certificationApiError(error: unknown) {
  const result = certificationError(error);
  if (result.status === 500) console.error("Certification request failed", error);
  return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status });
}

export function certificationValidationError(errors: unknown) {
  return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors }, { status: 422 });
}
