import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  SystemRoleCode,
} from "../app/generated/prisma/client";

interface RoleSeed {
  readonly code: SystemRoleCode;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[] | "ALL";
}

interface PermissionSeed {
  readonly module: string;
  readonly codes: readonly string[];
}

interface CommoditySeed {
  readonly code: string;
  readonly name: string;
  readonly isOther?: boolean;
}

const permissionCatalogue: readonly PermissionSeed[] = [
  {
    module: "AUTH",
    codes: [
      "auth.login",
      "auth.logout",
      "auth.session.read",
      "auth.session.revoke",
    ],
  },
  {
    module: "USER",
    codes: [
      "user.read",
      "user.create",
      "user.update",
      "user.delete",
      "user.role.assign",
    ],
  },
  {
    module: "BUSINESS",
    codes: [
      "business.read",
      "business.create",
      "business.update",
      "business.delete",
      "business.verify",
      "business.member.read",
      "business.member.create",
      "business.member.update",
      "business.member.delete",
      "business.document.read",
      "business.document.upload",
      "business.document.verify",
    ],
  },
  {
    module: "LABORATORY",
    codes: [
      "laboratory.request.read",
      "laboratory.request.create",
      "laboratory.request.update",
      "laboratory.sample.receive",
      "laboratory.sample.test",
      "laboratory.result.review",
      "laboratory.result.approve",
    ],
  },
  {
    module: "CERTIFICATION",
    codes: [
      "certification.read",
      "certification.create",
      "certification.review",
      "certification.approve",
      "certification.issue",
    ],
  },
  {
    module: "CONSULTATION",
    codes: [
      "consultation.read",
      "consultation.create",
      "consultation.assign",
      "consultation.respond",
    ],
  },
  {
    module: "MONITORING",
    codes: [
      "monitoring.read",
      "monitoring.create",
      "monitoring.update",
      "monitoring.evaluate",
    ],
  },
  { module: "REPORT", codes: ["report.read", "report.export"] },
  {
    module: "ADMINISTRATION",
    codes: [
      "role.read",
      "role.manage",
      "permission.read",
      "permission.manage",
      "audit.read",
      "master_data.manage",
    ],
  },
];

const authPermissions = [
  "auth.login",
  "auth.logout",
  "auth.session.read",
] as const;

const roleSeeds: readonly RoleSeed[] = [
  {
    code: SystemRoleCode.SUPER_ADMIN,
    name: "Super Administrator",
    description: "Akses penuh untuk administrasi dan operasional sistem.",
    permissions: "ALL",
  },
  {
    code: SystemRoleCode.ADMIN_DINAS,
    name: "Administrator Dinas",
    description: "Administrasi pengguna, layanan, data induk, dan audit dinas.",
    permissions: "ALL",
  },
  {
    code: SystemRoleCode.KEPALA_DINAS,
    name: "Kepala Dinas",
    description: "Pengawasan, persetujuan, evaluasi, dan pelaporan tingkat dinas.",
    permissions: [
      ...authPermissions,
      "user.read",
      "business.read",
      "business.verify",
      "business.document.read",
      "business.document.verify",
      "laboratory.request.read",
      "laboratory.result.review",
      "laboratory.result.approve",
      "certification.read",
      "certification.review",
      "certification.approve",
      "certification.issue",
      "consultation.read",
      "monitoring.read",
      "monitoring.evaluate",
      "report.read",
      "report.export",
      "role.read",
      "permission.read",
      "audit.read",
    ],
  },
  {
    code: SystemRoleCode.KEPALA_UPTD,
    name: "Kepala UPTD",
    description: "Pengawasan dan persetujuan layanan operasional UPTD.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.document.read",
      "laboratory.request.read",
      "laboratory.result.review",
      "laboratory.result.approve",
      "certification.read",
      "certification.review",
      "certification.approve",
      "consultation.read",
      "monitoring.read",
      "monitoring.evaluate",
      "report.read",
      "report.export",
      "audit.read",
    ],
  },
  {
    code: SystemRoleCode.KASI_PENGUJIAN,
    name: "Kasi Pengujian",
    description: "Koordinasi, peninjauan, dan persetujuan hasil pengujian.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.document.read",
      "laboratory.request.read",
      "laboratory.request.update",
      "laboratory.sample.receive",
      "laboratory.sample.test",
      "laboratory.result.review",
      "laboratory.result.approve",
      "monitoring.read",
      "report.read",
      "report.export",
    ],
  },
  {
    code: SystemRoleCode.PETUGAS_REGISTRASI,
    name: "Petugas Registrasi",
    description: "Verifikasi registrasi, keanggotaan, dan dokumen pelaku usaha.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.update",
      "business.verify",
      "business.member.read",
      "business.document.read",
      "business.document.verify",
      "report.read",
    ],
  },
  {
    code: SystemRoleCode.PETUGAS_PENERIMAAN_SAMPEL,
    name: "Petugas Penerimaan Sampel",
    description: "Penerimaan dan pembaruan data permohonan serta sampel.",
    permissions: [
      ...authPermissions,
      "business.read",
      "laboratory.request.read",
      "laboratory.request.update",
      "laboratory.sample.receive",
    ],
  },
  {
    code: SystemRoleCode.ANALIS_LAB,
    name: "Analis Laboratorium",
    description: "Pelaksanaan pengujian sampel laboratorium.",
    permissions: [
      ...authPermissions,
      "laboratory.request.read",
      "laboratory.sample.test",
    ],
  },
  {
    code: SystemRoleCode.PENYELIA_LAB,
    name: "Penyelia Laboratorium",
    description: "Penyeliaan pengujian serta peninjauan hasil laboratorium.",
    permissions: [
      ...authPermissions,
      "laboratory.request.read",
      "laboratory.request.update",
      "laboratory.sample.receive",
      "laboratory.sample.test",
      "laboratory.result.review",
      "laboratory.result.approve",
      "report.read",
    ],
  },
  {
    code: SystemRoleCode.PETUGAS_SERTIFIKASI,
    name: "Petugas Sertifikasi",
    description: "Pemrosesan, peninjauan, dan penerbitan sertifikasi.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.document.read",
      "laboratory.request.read",
      "certification.read",
      "certification.create",
      "certification.review",
      "certification.approve",
      "certification.issue",
      "report.read",
    ],
  },
  {
    code: SystemRoleCode.KONSULTAN_MUTU,
    name: "Konsultan Mutu",
    description: "Penanganan konsultasi dan pendampingan mutu.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.document.read",
      "consultation.read",
      "consultation.assign",
      "consultation.respond",
    ],
  },
  {
    code: SystemRoleCode.PETUGAS_MONEV,
    name: "Petugas Monitoring dan Evaluasi",
    description: "Pelaksanaan monitoring, evaluasi, dan pelaporan.",
    permissions: [
      ...authPermissions,
      "business.read",
      "laboratory.request.read",
      "certification.read",
      "consultation.read",
      "monitoring.read",
      "monitoring.create",
      "monitoring.update",
      "monitoring.evaluate",
      "report.read",
      "report.export",
    ],
  },
  {
    code: SystemRoleCode.PELAKU_USAHA,
    name: "Pelaku Usaha",
    description: "Pengelolaan usaha sendiri dan pengajuan layanan terkait.",
    permissions: [
      ...authPermissions,
      "business.read",
      "business.create",
      "business.update",
      "business.member.read",
      "business.member.create",
      "business.member.update",
      "business.member.delete",
      "business.document.read",
      "business.document.upload",
      "laboratory.request.read",
      "laboratory.request.create",
      "laboratory.request.update",
      "certification.read",
      "certification.create",
      "consultation.read",
      "consultation.create",
      "monitoring.read",
    ],
  },
  {
    code: SystemRoleCode.MITRA_BISNIS,
    name: "Mitra Bisnis",
    description: "Akses terbatas untuk melihat informasi usaha dan pelaporan.",
    permissions: [...authPermissions, "business.read", "report.read"],
  },
];

const commoditySeeds: readonly CommoditySeed[] = [
  { code: "UDANG", name: "Udang" },
  { code: "TUNA", name: "Tuna" },
  { code: "CAKALANG", name: "Cakalang" },
  { code: "BANDENG", name: "Bandeng" },
  { code: "RUMPUT_LAUT", name: "Rumput Laut" },
  { code: "KEPITING", name: "Kepiting" },
  { code: "LOBSTER", name: "Lobster" },
  { code: "LAINNYA", name: "Lainnya", isOther: true },
];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL wajib tersedia untuk menjalankan database seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const permissions = permissionCatalogue.flatMap(({ module, codes }) =>
    codes.map((code) => {
      const codeParts = code.split(".");
      const action = codeParts.pop();

      if (action === undefined || codeParts.length === 0) {
        throw new Error(`Format permission ${code} tidak valid.`);
      }

      return {
        code,
        resource: codeParts.join("."),
        action,
        description: `Izin ${code} pada modul ${module}.`,
      };
    }),
  );
  const permissionCodes = permissions.map(({ code }) => code);
  const roleCodes = roleSeeds.map(({ code }) => code);
  const commodityCodes = commoditySeeds.map(({ code }) => code);

  await prisma.$transaction(async (transaction) => {
    for (const permission of permissions) {
      await transaction.permission.upsert({
        where: { code: permission.code },
        create: { ...permission, isActive: true },
        update: { ...permission, isActive: true, deletedAt: null },
      });
    }

    for (const role of roleSeeds) {
      await transaction.role.upsert({
        where: { code: role.code },
        create: {
          code: role.code,
          name: role.name,
          description: role.description,
          isActive: true,
        },
        update: {
          name: role.name,
          description: role.description,
          isActive: true,
          deletedAt: null,
        },
      });
    }

    const storedPermissions = await transaction.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true, code: true },
    });
    const permissionIdByCode = new Map(
      storedPermissions.map(({ id, code }) => [code, id]),
    );

    for (const role of roleSeeds) {
      const storedRole = await transaction.role.findUniqueOrThrow({
        where: { code: role.code },
        select: { id: true },
      });
      const desiredCodes = role.permissions === "ALL"
        ? permissionCodes
        : role.permissions;
      const desiredPermissionIds = desiredCodes.map((code) => {
        const permissionId = permissionIdByCode.get(code);

        if (permissionId === undefined) {
          throw new Error(`Permission ${code} tidak ditemukan setelah upsert.`);
        }

        return permissionId;
      });

      await transaction.rolePermission.deleteMany({
        where: {
          roleId: storedRole.id,
          permission: { code: { in: permissionCodes } },
          permissionId: { notIn: desiredPermissionIds },
        },
      });

      for (const permissionId of desiredPermissionIds) {
        await transaction.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: storedRole.id, permissionId },
          },
          create: { roleId: storedRole.id, permissionId },
          update: {},
        });
      }
    }

    for (const commodity of commoditySeeds) {
      await transaction.commodity.upsert({
        where: { code: commodity.code },
        create: {
          code: commodity.code,
          name: commodity.name,
          isOther: commodity.isOther ?? false,
          isActive: true,
        },
        update: {
          name: commodity.name,
          isOther: commodity.isOther ?? false,
          isActive: true,
          deletedAt: null,
        },
      });
    }
  });

  const [roleCount, permissionCount, mappingCount, commodityCount] =
    await Promise.all([
      prisma.role.count({ where: { code: { in: roleCodes } } }),
      prisma.permission.count({ where: { code: { in: permissionCodes } } }),
      prisma.rolePermission.count({
        where: {
          role: { code: { in: roleCodes } },
          permission: { code: { in: permissionCodes } },
        },
      }),
      prisma.commodity.count({ where: { code: { in: commodityCodes } } }),
    ]);

  console.info("Seed SIGER-KAN selesai:", {
    roles: roleCount,
    permissions: permissionCount,
    rolePermissionMappings: mappingCount,
    commodities: commodityCount,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Seed SIGER-KAN gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
