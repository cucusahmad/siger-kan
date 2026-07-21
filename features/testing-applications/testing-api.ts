import { NextResponse } from "next/server";
import { applicationError, requireApplicant } from "./testing-application.auth";

export function apiError(error: unknown) { const result = applicationError(error); if (result.status === 500) console.error("Testing application request failed", error); return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status }); }
export function validationError(errors: unknown) { return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors }, { status: 422 }); }
export async function applicant(permission: "read" | "create" | "update") { const { user, membership } = await requireApplicant(permission); return { user, owner: { userId: user.id, businessId: membership.businessId } }; }
export function validId(id: string): boolean { return /^\d+$/.test(id); }

