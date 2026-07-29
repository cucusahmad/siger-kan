import { prisma } from "@/lib/prisma";

import type {
  ExecutiveBreakdown,
  ExecutiveDashboardData,
  ExecutiveTrendPoint,
} from "./executive-dashboard.types";

function countBy(values: readonly string[]): readonly ExecutiveBreakdown[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function monthKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function buildTrend(
  businesses: readonly Date[],
  products: readonly Date[],
  matches: readonly Date[],
): readonly ExecutiveTrendPoint[] {
  const formatter = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit", timeZone: "Asia/Jakarta" });
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    return {
      label: formatter.format(date),
      businesses: businesses.filter((item) => monthKey(item) === key).length,
      products: products.filter((item) => monthKey(item) === key).length,
      matches: matches.filter((item) => monthKey(item) === key).length,
    };
  });
}

export async function getExecutiveDashboardData(): Promise<ExecutiveDashboardData> {
  const [businesses, products, needs, businessOffers, productOffers, testing] = await Promise.all([
    prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, businessCode: true, name: true, status: true, createdAt: true,
        profile: { select: { businessType: true, regency: { select: { name: true } } } },
        _count: { select: { products: { where: { deletedAt: null } }, businessNeeds: { where: { deletedAt: null } }, businessOffers: { where: { deletedAt: null } } } },
      },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, status: true, isPublished: true, marketScope: true, createdAt: true,
        business: { select: { name: true } }, commodity: { select: { name: true } },
        category: { select: { name: true } }, _count: { select: { offers: { where: { deletedAt: null } } } },
      },
    }),
    prisma.businessNeed.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, status: true, quantity: true, createdAt: true, business: { select: { name: true } }, unit: { select: { symbol: true } } },
    }),
    prisma.businessOffer.findMany({
      where: { deletedAt: null },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true, quantity: true, unitPrice: true, status: true, submittedAt: true,
        businessNeed: { select: { title: true, business: { select: { name: true } }, unit: { select: { symbol: true } } } },
        supplierBusiness: { select: { name: true } },
      },
    }),
    prisma.productOffer.findMany({
      where: { deletedAt: null },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true, quantity: true, unitPrice: true, status: true, submittedAt: true,
        product: { select: { name: true, business: { select: { name: true } }, unit: { select: { symbol: true } } } },
        buyerBusiness: { select: { name: true } },
      },
    }),
    prisma.testingApplication.findMany({
      where: { deletedAt: null, applicationNumber: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, applicationNumber: true, status: true, submittedAt: true,
        businessProfile: { select: { business: { select: { name: true } } } },
        product: { select: { productName: true } }, laboratory: { select: { name: true } },
      },
    }),
  ]);

  const acceptedMatches = businessOffers.filter(({ status }) => status === "ACCEPTED").length
    + productOffers.filter(({ status }) => status === "ACCEPTED").length;
  const publishedNeeds = needs.filter(({ status }) => status === "PUBLISHED").length;
  const verifiedProducts = products.filter(({ status }) => status === "VERIFIED").length;
  const completedTests = testing.filter(({ status }) => status === "SELESAI").length;
  const allMatchDates = [...businessOffers.map(({ submittedAt }) => submittedAt), ...productOffers.map(({ submittedAt }) => submittedAt)];

  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      { label: "Pelaku Usaha", value: businesses.length, detail: `${businesses.filter(({ status }) => status === "ACTIVE").length} usaha aktif` },
      { label: "Produk Terdaftar", value: products.length, detail: `${verifiedProducts} produk terverifikasi` },
      { label: "Kebutuhan Aktif", value: publishedNeeds, detail: `${needs.length} total kebutuhan` },
      { label: "Aktivitas Matching", value: businessOffers.length + productOffers.length, detail: `${acceptedMatches} kesepakatan diterima` },
      { label: "Pengujian Mutu", value: testing.length, detail: `${completedTests} pengujian selesai` },
    ],
    businessStatuses: countBy(businesses.map(({ status }) => status)),
    productStatuses: countBy(products.map(({ status }) => status)),
    topRegions: countBy(businesses.map(({ profile }) => profile?.regency.name ?? "Belum dilengkapi")).slice(0, 6),
    topCommodities: countBy(products.map(({ commodity }) => commodity.name)).slice(0, 6),
    testingPipeline: countBy(testing.map(({ status }) => status)),
    trend: buildTrend(businesses.map(({ createdAt }) => createdAt), products.map(({ createdAt }) => createdAt), allMatchDates),
    businesses: businesses.map((item) => ({
      id: item.id.toString(), code: item.businessCode, name: item.name,
      type: item.profile?.businessType ?? "Belum dilengkapi", region: item.profile?.regency.name ?? "Belum dilengkapi",
      status: item.status, productCount: item._count.products, needCount: item._count.businessNeeds,
      offerCount: item._count.businessOffers, registeredAt: item.createdAt.toISOString(),
    })),
    products: products.map((item) => ({
      id: item.id.toString(), name: item.name, businessName: item.business.name,
      commodity: item.commodity.name, category: item.category.name, marketScope: item.marketScope,
      status: item.status, published: item.isPublished, offerCount: item._count.offers,
    })),
    matches: [
      ...businessOffers.map((item) => ({
        id: `need-${item.id}`, source: "KEBUTUHAN" as const, subject: item.businessNeed.title,
        requester: item.businessNeed.business.name, partner: item.supplierBusiness.name,
        quantity: `${item.quantity.toString()} ${item.businessNeed.unit.symbol}`,
        value: (item.quantity.mul(item.unitPrice)).toString(), status: item.status, submittedAt: item.submittedAt.toISOString(),
      })),
      ...productOffers.map((item) => ({
        id: `product-${item.id}`, source: "PRODUK" as const, subject: item.product.name,
        requester: item.buyerBusiness.name, partner: item.product.business.name,
        quantity: `${item.quantity.toString()} ${item.product.unit.symbol}`,
        value: (item.quantity.mul(item.unitPrice)).toString(), status: item.status, submittedAt: item.submittedAt.toISOString(),
      })),
    ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    testing: testing.map((item) => ({
      id: item.id.toString(), applicationNumber: item.applicationNumber ?? "-",
      businessName: item.businessProfile.business.name, productName: item.product?.productName ?? "Belum diisi",
      laboratoryName: item.laboratory?.name ?? "Belum ditentukan", status: item.status,
      submittedAt: item.submittedAt?.toISOString() ?? null,
    })),
  };
}
