import { AuditAction, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";

import {
  categoryMasterSchema,
  commodityMasterSchema,
  unitMasterSchema,
} from "./master-data.schema";
import type { EditableMasterResource, MasterDataPayload, MasterRecord } from "./master-data.types";

function textOrNull(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}

function record(
  value: Omit<MasterRecord, "id" | "updatedAt"> & { readonly id: bigint; readonly updatedAt: Date },
): MasterRecord {
  return { ...value, id: value.id.toString(), updatedAt: value.updatedAt.toISOString() };
}

async function getOptions(): Promise<MasterDataPayload["options"]> {
  const [commodities, categories, units] = await Promise.all([
    prisma.commodity.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productCategory.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.unit.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } }),
  ]);
  return {
    commodities: commodities.map(({ id, name }) => ({ id: id.toString(), label: name })),
    categories: categories.map(({ id, name }) => ({ id: id.toString(), label: name })),
    units: units.map(({ id, name, symbol }) => ({ id: id.toString(), label: `${name} (${symbol})` })),
  };
}

export async function getMasterData(resource: EditableMasterResource): Promise<MasterDataPayload> {
  const options = await getOptions();
  let records: readonly MasterRecord[];

  if (resource === "commodities") {
    const values = await prisma.commodity.findMany({ where: { deletedAt: null }, orderBy: [{ isActive: "desc" }, { name: "asc" }] });
    records = values.map((value) => record({ id: value.id, code: value.code, name: value.name, scientificName: value.scientificName, description: null, isActive: value.isActive, updatedAt: value.updatedAt }));
  } else if (resource === "categories") {
    const values = await prisma.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: { parent: { select: { name: true } } },
    });
    records = values.map((value) => record({
      id: value.id, code: value.code, name: value.name, description: value.description,
      parentId: value.parentId?.toString(), parentName: value.parent?.name,
      isActive: value.isActive, updatedAt: value.updatedAt,
    }));
  } else {
    const values = await prisma.unit.findMany({ where: { deletedAt: null }, orderBy: [{ isActive: "desc" }, { name: "asc" }] });
    records = values.map((value) => record({ id: value.id, code: value.code, name: value.name, symbol: value.symbol, description: value.description, isActive: value.isActive, updatedAt: value.updatedAt }));
  }
  return { records, options };
}

export function parseMasterInput(resource: EditableMasterResource, input: unknown) {
  if (resource === "commodities") return commodityMasterSchema.safeParse(input);
  if (resource === "categories") return categoryMasterSchema.safeParse(input);
  return unitMasterSchema.safeParse(input);
}

interface MutationInput {
  readonly resource: EditableMasterResource;
  readonly id?: string;
  readonly input: Record<string, unknown>;
  readonly actorUserId: string;
  readonly context: RequestContext;
}

export async function saveMasterData({ resource, id, input, actorUserId, context }: MutationInput): Promise<void> {
  const normalizedCode = String(input.code).trim().toUpperCase();
  const common = { code: normalizedCode, name: String(input.name).trim(), isActive: Boolean(input.isActive) };
  await prisma.$transaction(async (transaction) => {
    let entityId: bigint;
    if (resource === "commodities") {
      const data = { ...common, scientificName: textOrNull(String(input.scientificName ?? "")), deletedAt: null };
      const value = id ? await transaction.commodity.update({ where: { id: BigInt(id), deletedAt: null }, data }) : await transaction.commodity.create({ data });
      entityId = value.id;
    } else if (resource === "categories") {
      const parentId = textOrNull(String(input.parentId ?? ""));
      if (id && parentId === id) throw new Error("CATEGORY_SELF_PARENT");
      const data = { ...common, parentId: parentId ? BigInt(parentId) : null, description: textOrNull(String(input.description ?? "")), deletedAt: null };
      const value = id ? await transaction.productCategory.update({ where: { id: BigInt(id), deletedAt: null }, data }) : await transaction.productCategory.create({ data });
      entityId = value.id;
    } else {
      const data = { ...common, symbol: String(input.symbol).trim(), description: textOrNull(String(input.description ?? "")), deletedAt: null };
      const value = id ? await transaction.unit.update({ where: { id: BigInt(id), deletedAt: null }, data }) : await transaction.unit.create({ data });
      entityId = value.id;
    }
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(actorUserId), action: id ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: `MASTER_${resource.toUpperCase()}`, entityId: entityId.toString(),
      newValue: input as Prisma.InputJsonValue, ipAddress: context.ipAddress, userAgent: context.userAgent,
    } });
  });
}

export async function deleteMasterData(resource: EditableMasterResource, id: string, actorUserId: string, context: RequestContext): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const data = { deletedAt: new Date(), isActive: false };
    if (resource === "commodities") await transaction.commodity.update({ where: { id: BigInt(id), deletedAt: null }, data });
    else if (resource === "categories") await transaction.productCategory.update({ where: { id: BigInt(id), deletedAt: null }, data });
    else await transaction.unit.update({ where: { id: BigInt(id), deletedAt: null }, data });
    await transaction.auditLog.create({ data: {
      actorUserId: BigInt(actorUserId), action: AuditAction.DELETE, entityType: `MASTER_${resource.toUpperCase()}`,
      entityId: id, ipAddress: context.ipAddress, userAgent: context.userAgent,
    } });
  });
}

export function getMasterError(error: unknown): { readonly status: number; readonly message: string } {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return { status: 401, message: "Sesi Anda telah berakhir." };
  if (error instanceof Error && error.message === "FORBIDDEN") return { status: 403, message: "Menu master data hanya dapat diakses Super Admin." };
  if (error instanceof Error && error.message === "CATEGORY_SELF_PARENT") return { status: 422, message: "Kategori tidak dapat menjadi induk bagi dirinya sendiri." };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { status: 409, message: "Kode atau nama sudah digunakan oleh data lain." };
    if (error.code === "P2025") return { status: 404, message: "Data master tidak ditemukan." };
    if (error.code === "P2003") return { status: 422, message: "Referensi master tidak valid atau data masih digunakan." };
  }
  return { status: 500, message: "Data master belum dapat diproses. Silakan coba kembali." };
}
