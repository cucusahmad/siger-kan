import { BriefcaseBusiness } from "lucide-react";

const businessTypes = [
  ["FISH_FARMER", "Pembudidaya Ikan"], ["FISHER", "Nelayan"], ["PROCESSOR", "Pengolah"],
  ["DISTRIBUTOR", "Distributor"], ["EXPORTER", "Eksportir"], ["MSME", "UMKM"], ["OTHER", "Lainnya"],
] as const;

export function BusinessTypesPage() {
  return <div className="space-y-6"><section className="rounded-3xl bg-[#073B4C] p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61C0BF]">Business Matching · Master Data</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Master Business Type</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Referensi jenis pelaku usaha yang saat ini digunakan pada registrasi dan profil usaha.</p></section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Business Type masih dikelola sebagai enum sistem agar tetap konsisten dengan alur registrasi. Data ini ditampilkan read-only.</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{businessTypes.map(([code, label]) => <article key={code} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-[#087E8B]"><BriefcaseBusiness size={20} /></span><div><h2 className="font-bold text-[#073B4C]">{label}</h2><p className="mt-1 font-mono text-xs text-slate-500">{code}</p></div></article>)}</div></section></div>;
}
