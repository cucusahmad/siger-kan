import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/business/get-current-business";
import { prisma } from "@/lib/prisma";
export default async function NotificationsPage() {
  const user = await getCurrentUser(); if (!user) redirect("/login"); const items = await prisma.notification.findMany({ where: { userId: BigInt(user.id) }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-[#087E8B]">Aktivitas Akun</p><h1 className="mt-1 text-3xl font-bold text-[#073B4C]">Notifikasi</h1></header><section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{items.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Belum ada notifikasi.</p> : items.map((item) => { const href = item.title === "Permohonan disetujui Kepala UPTD" ? `${item.href}/pengiriman` : item.href; return <article key={item.id.toString()} className="p-5"><p className="font-bold text-[#073B4C]">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><div className="mt-3 flex items-center justify-between"><time className="text-xs text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</time>{href && <Link href={href} className="text-sm font-bold text-[#087E8B]">Buka</Link>}</div></article>; })}</section></div>;
}
