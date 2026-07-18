"use client";

import { AlertTriangle } from "lucide-react";

export default function BusinessError({ reset }: { readonly reset: () => void }) {
  return <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#E63946]/20 bg-white p-8 text-center"><AlertTriangle className="h-10 w-10 text-[#E63946]" /><h1 className="mt-4 text-xl font-bold text-navy">Profil usaha gagal dimuat</h1><p className="mt-2 text-sm text-muted">Terjadi kendala saat mengambil data. Silakan coba kembali.</p><button type="button" onClick={reset} className="mt-5 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white">Coba Lagi</button></section>;
}
