"use client";
export default function ErrorPage({ reset }: { readonly reset: () => void }) { return <div className="rounded-2xl border border-red-200 bg-white p-10 text-center"><h2 className="font-bold text-[#073B4C]">Data belum dapat dimuat</h2><button onClick={reset} className="mt-4 rounded-xl bg-[#073B4C] px-4 py-2 text-sm font-bold text-white">Coba Lagi</button></div>; }

