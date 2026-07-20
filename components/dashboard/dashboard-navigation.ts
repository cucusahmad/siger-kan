export type DashboardIconKey =
  | "badgeCheck"
  | "beaker"
  | "bookOpen"
  | "briefcaseBusiness"
  | "building"
  | "chart"
  | "clipboardCheck"
  | "dashboard"
  | "fileBadge"
  | "fileChart"
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
}

export interface DashboardNavigationContext {
  readonly roleCodes: readonly string[];
  readonly permissions: readonly string[];
  readonly hasBusinessMembership: boolean;
}

const externalRoles = ["PELAKU_USAHA"] as const;
const adminDinasRoles = ["ADMIN_DINAS", "SUPER_ADMIN"] as const;

export const dashboardNavigation: readonly DashboardNavigationGroup[] = [
  {
    label: "Dashboard",
    icon: "dashboard",
    items: [{ label: "Ringkasan", href: "/dashboard", icon: "dashboard" }],
  },
  {
    label: "Pelaku Usaha",
    icon: "building",
    items: [
      { label: "Data Pelaku Usaha", href: "/dashboard/pelaku-usaha", icon: "building", allowedRoles: adminDinasRoles },
      { label: "Profil Usaha", href: "/dashboard/business", icon: "briefcaseBusiness", requiredPermissions: ["business.read"], excludedRoles: ["ADMIN_DINAS"] },
      { label: "Legalitas Usaha", href: "/dashboard/business/legal-documents", icon: "fileBadge", requiredPermissions: ["business.document.read"], excludedRoles: ["ADMIN_DINAS"] },
      { label: "Komoditas", href: "/dashboard/business/commodities", icon: "packageSearch", requiredPermissions: ["business.read"], excludedRoles: ["ADMIN_DINAS"] },
    ],
  },
  {
    label: "Layanan Mutu",
    icon: "badgeCheck",
    items: [
      { label: "Pengujian Mutu", href: "/dashboard/quality-testing", icon: "beaker", requiredPermissions: ["laboratory.request.read"] },
      { label: "Sertifikasi", href: "/dashboard/certification", icon: "clipboardCheck", requiredPermissions: ["certification.read"] },
      { label: "Klinik Mutu", href: "/dashboard/quality-clinic", icon: "messageSquareHeart", requiredPermissions: ["consultation.read"] },
    ],
  },
  {
    label: "Pengembangan Usaha",
    icon: "handshake",
    items: [
      { label: "Business Matching", href: "/dashboard/business-matching", icon: "handshake", allowedRoles: externalRoles },
      { label: "AI Knowledge Base", href: "/dashboard/knowledge-base", icon: "bookOpen", allowedRoles: externalRoles },
    ],
  },
  {
    label: "Monitoring",
    icon: "chart",
    items: [
      { label: "Monitoring dan Evaluasi", href: "/dashboard/monitoring", icon: "chart", requiredPermissions: ["monitoring.read"] },
      { label: "Laporan dan Analitik", href: "/dashboard/reports", icon: "fileChart", allowedRoles: externalRoles, requiredPermissions: ["report.read"] },
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
    .map((group) => ({ ...group, items: group.items.filter((item) => isNavigationItemVisible(item, context)) }))
    .filter((group) => group.items.length > 0);
}

export function isDashboardRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getDashboardBreadcrumbs(pathname: string): readonly { readonly label: string; readonly href?: string }[] {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname.startsWith("/dashboard/pelaku-usaha/")) return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pelaku Usaha", href: "/dashboard" },
    { label: "Detail Pelaku Usaha" },
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
  if (pathname.startsWith("/dashboard/pelaku-usaha/")) return "Detail Pelaku Usaha";
  for (const group of dashboardNavigation) {
    const item = group.items.find(({ href }) => href === pathname);
    if (item) return item.label;
  }
  return "Dashboard";
}
