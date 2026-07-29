import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/features/master-data/master-data.auth";
import { deleteMasterData, getMasterData, getMasterError, parseMasterInput, saveMasterData } from "@/features/master-data/master-data.service";
import { isEditableMasterResource } from "@/features/master-data/master-data.types";
import { getRequestContext } from "@/lib/request-context";

interface RouteContext {
  readonly params: Promise<{ readonly resource: string; readonly id: string }>;
}

function isValidId(value: string): boolean {
  return /^\d+$/.test(value);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { resource, id } = await params;
  if (!isEditableMasterResource(resource) || !isValidId(id)) return NextResponse.json({ success: false, message: "Data master tidak valid.", errors: {} }, { status: 404 });
  try {
    const user = await requireSuperAdminApi();
    const body: unknown = await request.json();
    const parsed = parseMasterInput(resource, body);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Periksa kembali data yang diisi.", errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    await saveMasterData({ resource, id, input: { ...parsed.data }, actorUserId: user.id, context: getRequestContext(request) });
    return NextResponse.json({ success: true, message: "Data master berhasil diperbarui.", data: await getMasterData(resource) });
  } catch (error: unknown) {
    const result = getMasterError(error);
    if (result.status === 500) console.error("Master data update failed", { resource, id, error });
    return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { resource, id } = await params;
  if (!isEditableMasterResource(resource) || !isValidId(id)) return NextResponse.json({ success: false, message: "Data master tidak valid.", errors: {} }, { status: 404 });
  try {
    const user = await requireSuperAdminApi();
    await deleteMasterData(resource, id, user.id, getRequestContext(request));
    return NextResponse.json({ success: true, message: "Data master berhasil dihapus.", data: await getMasterData(resource) });
  } catch (error: unknown) {
    const result = getMasterError(error);
    if (result.status === 500) console.error("Master data delete failed", { resource, id, error });
    return NextResponse.json({ success: false, message: result.message, errors: {} }, { status: result.status });
  }
}
