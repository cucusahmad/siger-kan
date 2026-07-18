"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionLink, Icon } from "./landing-ui";

const navigation = [
  ["Beranda", "#beranda"], ["Tentang", "#tentang"], ["Layanan", "#layanan"],
  ["Alur Layanan", "#alur-layanan"], ["Manfaat", "#manfaat"], ["Statistik", "#statistik"], ["FAQ", "#faq"],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 16); handleScroll(); window.addEventListener("scroll", handleScroll, { passive: true }); return () => window.removeEventListener("scroll", handleScroll); }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "border-b border-navy/8 bg-white/92 shadow-[0_8px_30px_rgba(7,59,76,.07)] backdrop-blur-xl" : "bg-white/70 backdrop-blur-md"}`}>
    <nav className={`container-page flex items-center justify-between transition-all ${scrolled ? "h-17" : "h-20"}`} aria-label="Navigasi utama">
      <Link href="#beranda" className="flex items-center gap-3" aria-label="SIGER-KAN - Beranda"><Image src="/siger-kan-mark.svg" alt="" width={42} height={42} priority/><span><strong className="block text-lg leading-none tracking-tight text-navy">SIGER-KAN</strong><small className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[.14em] text-ocean sm:block">Gerai Mutu dan Perikanan</small></span></Link>
      <div className="hidden items-center gap-5 xl:flex">{navigation.map(([label, href]) => <Link key={href} href={href} className="text-[13px] font-semibold text-ink/75 transition-colors hover:text-ocean">{label}</Link>)}</div>
      <div className="hidden items-center gap-2 md:flex"><Link href="/login" className="px-4 py-3 text-sm font-bold text-navy hover:text-ocean">Masuk</Link><ActionLink href="/register" className="!min-h-10 !px-5">Daftar Pelaku Usaha</ActionLink></div>
      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy/10 text-navy md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Tutup menu" : "Buka menu"}><Icon name={open ? "x" : "menu"} /></button>
    </nav>
    <div id="mobile-navigation" className={`border-t border-navy/8 bg-white px-4 transition-[max-height,opacity] duration-300 md:hidden ${open ? "max-h-[calc(100vh-5rem)] opacity-100" : "pointer-events-none max-h-0 overflow-hidden opacity-0"}`}>
      <div className="container-page flex flex-col py-5">{navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="border-b border-navy/7 py-3.5 font-semibold text-navy">{label}</Link>)}<div className="mt-5 grid grid-cols-2 gap-3"><ActionLink href="/login" variant="secondary">Masuk</ActionLink><ActionLink href="/register">Daftar</ActionLink></div></div>
    </div>
  </header>;
}
