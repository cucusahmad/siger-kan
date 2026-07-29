import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/features/master-data/master-data.auth";
import { getMasterData, getMasterError, parseMasterInput, saveMasterData } from "@/features/master-data/master-data.service";
import { isEditableMasterResource } from "@/features/master-data/master-data.types";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly resource: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { resource } = await params;
  if (!isEditableMasterResource(resource)) return NextResponse.json({ success: false, message: "Master data tidak dikenal.", errors: {} }, { status: 404 });
  try {
    await requireSuperAdminApi();
    return NextResponse.json({ success: true, message: "Data master berhasil dimuat.", data: await getMasterData(resource) });
  } catch (error: unknown) {
    const result = getMasterError(error);
    if (result.status === 500) console.error("Master data read failed", { resource, error });
    return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { resource } = await params;
  if (!isEditableMasterResource(resource)) return NextResponse.json({ success: false, message: "Master data tidak dikenal.", errors: {} }, { status: 404 });
  try {
    const user = await requireSuperAdminApi();
    const body: unknown = await request.json();
    const parsed = parseMasterInput(resource, body);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    await saveMasterData({ resource, input: { ...parsed.data }, actorUserId: user.id, context: getRequestContext(request) });
    return NextResponse.json({ success: true, message: "Data master berhasil ditambahkan.", data: await getMasterData(resource) }, { status: 201 });
  } catch (error: unknown) {
    const result = getMasterError(error);
    if (result.status === 500) console.error("Master data create failed", { resource, error });
    return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status });
  }
}
