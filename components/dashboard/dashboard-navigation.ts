export type DashboardIconKey =
  | "badgeCheck"
  | "beaker"
  | "bookOpen"
  | "briefcaseBusiness"
  | "building"
  | "boxes"
  | "chart"
  | "clipboardCheck"
  | "dashboard"
  | "fileBadge"
  | "fileChart"
  | "fileSpreadsheet"
  | "handshake"
  | "messageSquareHeart"
  | "packageSearch"
  | "settings"
  | "user";

export interface DashboardNavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon: DashboardIconKey;
  readonly allowedRoles?: readonly string[];
  readonly requiredPermissions?: readonly string[];
  readonly requiresBusinessMembership?: boolean;
  readonly excludedRoles?: readonly string[];
}

export interface DashboardNavigationGroup {
  readonly label: string;
  readonly icon: DashboardIconKey;
  readonly items: readonly DashboardNavigationItem[];
  readonly allowedRoles?: readonly string[];
}

export interface DashboardNavigationContext {
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
  readonly hasBusinessMembership: boolean;
}

const externalRoles = ["PELAKU_USAHA"] as const;
export const dashboardNavigation: readonly DashboardNavigationGroup[] = [
  {
    label: "Dashboard",
    icon: "dashboard",
    items: [
      { label: "Ringkasan", href: "/dashboard", icon: "dashboard" },
      { label: "Ringkasan Pengujian", href: "/dashboard/testing-summary", icon: "beaker", allowedRoles: ["KEPALA_UPTD", "KEPALA_DINAS"], requiredPermissions: ["report.read"] },
      { label: "Ringkasan Business Match", href: "/dashboard/business-match-summary", icon: "handshake", allowedRoles: ["KEPALA_UPTD", "KEPALA_DINAS"], requiredPermissions: ["report.read"] },
    ],
  },
  {
    label: "Pelaku Usaha",
    icon: "building",
    allowedRoles: externalRoles,
    items: [
      { label: "Profil Usaha", href: "/dashboard/business", icon: "briefcaseBusiness", requiredPermissions: ["business.read"] },
      { label: "Legalitas Usaha", href: "/dashboard/business/legal-documents", icon: "fileBadge", requiredPermissions: ["business.document.read"] },
      { label: "Komoditas", href: "/dashboard/business/commodities", icon: "packageSearch", requiredPermissions: ["business.read"] },
      { label: "Kelola Produk", href: "/dashboard/business/products", icon: "boxes", requiredPermissions: ["business.read"], requiresBusinessMembership: true },
    ],
  },
  {
    label: "Data Pelaku Usaha",
    icon: "building",
    allowedRoles: ["ADMIN_DINAS", "KEPALA_UPTD", "SUPER_ADMIN"],
    items: [
      { label: "Daftar Pelaku Usaha", href: "/dashboard/pelaku-usaha", icon: "building", allowedRoles: ["ADMIN_DINAS", "KEPALA_UPTD", "SUPER_ADMIN"] },
      { label: "Verifikasi Produk", href: "/dashboard/product-verification", icon: "clipboardCheck", allowedRoles: ["ADMIN_DINAS", "SUPER_ADMIN"], requiredPermissions: ["business.verify"] },
    ],
  },
  {
    label: "Master Data",
    icon: "boxes",
    allowedRoles: ["SUPER_ADMIN"],
    items: [
      { label: "Business", href: "/dashboard/pelaku-usaha", icon: "building", allowedRoles: ["SUPER_ADMIN"] },
      { label: "Business Type", href: "/dashboard/master-data/business-types", icon: "briefcaseBusiness", allowedRoles: ["SUPER_ADMIN"] },
      { label: "Commodity", href: "/dashboard/master-data/commodities", icon: "packageSearch", allowedRoles: ["SUPER_ADMIN"] },
      { label: "Category", href: "/dashboard/master-data/categories", icon: "boxes", allowedRoles: ["SUPER_ADMIN"] },
      { label: "Unit", href: "/dashboard/master-data/units", icon: "boxes", allowedRoles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Pengujian Mutu",
    icon: "badgeCheck",
    items: [
      { label: "Pengajuan Pengujian", href: "/dashboard/permohonan", icon: "fileBadge", allowedRoles: externalRoles, requiredPermissions: ["laboratory.request.read"], requiresBusinessMembership: true },
      { label: "Tracking Proses Laboratorium", href: "/dashboard/quality-testing/tracking", icon: "beaker", allowedRoles: externalRoles, requiredPermissions: ["laboratory.request.read"], requiresBusinessMembership: true },
      { label: "Unduh LHU", href: "/dashboard/lhu-final", icon: "fileChart", allowedRoles: externalRoles, requiredPermissions: ["laboratory.request.read"], requiresBusinessMembership: true },
      { label: "Penerimaan Sampel", href: "/dashboard/quality-testing/sample-reception", icon: "packageSearch", requiredPermissions: ["laboratory.sample.receive"] },
      { label: "Persetujuan Kepala UPTD", href: "/dashboard/quality-testing/uptd-approval", icon: "clipboardCheck", allowedRoles: ["KEPALA_UPTD"] },
      { label: "Penugasan Pengujian", href: "/dashboard/quality-testing/work-orders", icon: "clipboardCheck", allowedRoles: ["PENYELIA_LAB", "ANALIS_LAB"] },
      { label: "Pengiriman Laboratorium Mitra", href: "/dashboard/quality-testing/subcontract", icon: "packageSearch", allowedRoles: ["PENYELIA_LAB"] },
      { label: "Verifikasi Hasil", href: "/dashboard/quality-testing/result-verification", icon: "clipboardCheck", requiredPermissions: ["laboratory.result.review", "laboratory.result.approve"] },
      { label: "Penerbitan LHU", href: "/dashboard/quality-testing/reports", icon: "fileChart", allowedRoles: ["PENYELIA_LAB", "KEPALA_UPTD"], requiredPermissions: ["laboratory.result.review", "laboratory.result.approve"] },
      { label: "Laporan Pengajuan", href: "/dashboard/reports", icon: "fileChart", allowedRoles: ["KEPALA_UPTD", "KEPALA_DINAS"], requiredPermissions: ["report.read"] },
    ],
  },
  {
    label: "Sertifikasi dan Pendampingan",
    icon: "badgeCheck",
    items: [
      { label: "Sertifikasi", href: "/dashboard/certification", icon: "clipboardCheck", requiredPermissions: ["certification.read"] },
      { label: "Klinik Mutu", href: "/dashboard/quality-clinic", icon: "messageSquareHeart", requiredPermissions: ["consultation.read"] },
    ],
  },
  {
    label: "Pengembangan Usaha",
    icon: "handshake",
    items: [
      { label: "Business Matching", href: "/dashboard/business-matching", icon: "handshake", allowedRoles: externalRoles },
      { label: "Katalog Produk", href: "/dashboard/product-catalog", icon: "packageSearch", allowedRoles: externalRoles, requiredPermissions: ["business.read"], requiresBusinessMembership: true },
      { label: "Penawaran", href: "/dashboard/offers", icon: "handshake", allowedRoles: externalRoles, requiredPermissions: ["business.read"], requiresBusinessMembership: true },
      { label: "AI Knowledge Base", href: "/dashboard/knowledge-base", icon: "bookOpen", allowedRoles: externalRoles },
    ],
  },
  {
    label: "Monitoring",
    icon: "chart",
    items: [
      { label: "Monitoring dan Evaluasi", href: "/dashboard/monitoring", icon: "chart", requiredPermissions: ["monitoring.read"] },
      { label: "Laporan Eksekutif", href: "/dashboard/executive-report", icon: "fileSpreadsheet", allowedRoles: ["KEPALA_DINAS", "KEPALA_UPTD"], requiredPermissions: ["report.read"] },
    ],
  },
  {
    label: "Pengaturan",
    icon: "settings",
    items: [
      { label: "Profil Saya", href: "/dashboard/profile", icon: "user" },
      { label: "Pengaturan Akun", href: "/dashboard/settings", icon: "settings" },
    ],
  },
] as const;

export function isNavigationItemVisible(
  item: DashboardNavigationItem,
  context: DashboardNavigationContext,
): boolean {
  if (item.excludedRoles?.some((role) => context.roleCodes.includes(role))) return false;
  if (context.roleCodes.includes("SUPER_ADMIN")) return true;
  const isAllowedByRole = item.allowedRoles?.some((role) => context.roleCodes.includes(role)) ?? false;
  const isAllowedByPermission = item.requiredPermissions?.some((permission) => context.permissions.includes(permission)) ?? false;
  if (item.allowedRoles && item.requiredPermissions && !isAllowedByRole && !isAllowedByPermission) return false;
  if (item.allowedRoles && !item.requiredPermissions && !isAllowedByRole) return false;
  if (item.requiredPermissions && !item.allowedRoles && !isAllowedByPermission) return false;
  if (item.requiresBusinessMembership && !context.hasBusinessMembership) return false;
  return true;
}

export function getVisibleNavigation(
  context: DashboardNavigationContext,
): readonly DashboardNavigationGroup[] {
  return dashboardNavigation
    .filter((group) => !group.allowedRoles || group.allowedRoles.some((role) => context.roleCodes.includes(role)))
    .map((group) => ({ ...group, items: group.items.filter((item) => isNavigationItemVisible(item, context)) }))
    .filter((group) => group.items.length > 0);
}

export function isDashboardRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getDashboardBreadcrumbs(pathname: string): readonly { readonly label: string; readonly href?: string }[] {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname === "/dashboard/testing-summary/report") return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ringkasan Pengujian", href: "/dashboard/testing-summary" },
    { label: "Laporan Lengkap" },
  ];
  if (pathname === "/dashboard/business-match-summary/report") return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ringkasan Business Match", href: "/dashboard/business-match-summary" },
    { label: "Laporan Lengkap" },
  ];
  if (pathname.startsWith("/dashboard/lhu-final/")) return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pengujian Mutu" },
    { label: "LHU Final", href: "/dashboard/lhu-final" },
    { label: "Detail LHU Final" },
  ];
  if (pathname.startsWith("/dashboard/reports/")) return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pengujian Mutu" },
    { label: "Laporan Pengajuan", href: "/dashboard/reports" },
    { label: "Detail Pengajuan" },
  ];
  if (pathname.startsWith("/dashboard/pelaku-usaha/")) return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pelaku Usaha", href: "/dashboard/pelaku-usaha" },
    { label: "Detail Pelaku Usaha" },
  ];
  if (pathname.startsWith("/dashboard/product-verification/")) return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Data Pelaku Usaha" },
    { label: "Verifikasi Produk", href: "/dashboard/product-verification" },
    { label: "Detail Produk" },
  ];
  for (const group of dashboardNavigation) {
    const item = group.items.find(({ href }) => href === pathname);
    if (item) return [
      { label: "Dashboard", href: "/dashboard" },
      ...(group.label === "Dashboard" ? [] : [{ label: group.label }]),
      { label: item.label },
    ];
  }
  return [{ label: "Dashboard", href: "/dashboard" }, { label: "Halaman" }];
}

export function getDashboardPageTitle(pathname: string): string {
  if (pathname === "/dashboard/testing-summary/report") return "Laporan Lengkap Pengujian";
  if (pathname === "/dashboard/business-match-summary/report") return "Laporan Lengkap Business Match";
  if (pathname.startsWith("/dashboard/reports/")) return "Detail Laporan Pengajuan";
  if (pathname.startsWith("/dashboard/lhu-final/")) return "Detail LHU Final";
  if (pathname.startsWith("/dashboard/pelaku-usaha/")) return "Detail Pelaku Usaha";
  if (pathname.startsWith("/dashboard/product-verification/")) return "Detail Verifikasi Produk";
  for (const group of dashboardNavigation) {
    const item = group.items.find(({ href }) => href === pathname);
    if (item) return item.label;
  }
  return "Dashboard";
}
