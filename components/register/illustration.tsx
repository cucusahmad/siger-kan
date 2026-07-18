import { BadgeCheck, FlaskConical, Waves } from "lucide-react";

const serviceSteps = [
  { label: "Sampel diterima", detail: "Laboratorium Mutu", state: "Selesai" },
  { label: "Pengujian mutu", detail: "7 parameter aktif", state: "Berjalan" },
  { label: "Sertifikat digital", detail: "Terbit otomatis", state: "Berikutnya" },
] as const;

export function RegistrationIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:mx-0">
      <div className="absolute -left-10 top-16 h-36 w-36 rounded-full border border-white/10" />
      <div className="absolute -right-8 bottom-14 h-28 w-28 rounded-full bg-gold/12 blur-sm" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/9 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-5">
        <div className="rounded-[1.5rem] bg-[#f7fbfb] p-5 text-navy shadow-inner sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-ocean">Ekosistem usaha</p><h2 className="mt-1 text-lg font-bold">Perjalanan Mutu Anda</h2></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-aqua"><Waves className="h-5 w-5" /></span>
          </div>
          <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-4">
            {serviceSteps.map((step, index) => (
              <div key={step.label} className="contents">
                <div className="flex flex-col items-center">
                  <span className={`z-10 flex h-9 w-9 items-center justify-center rounded-xl ${index === 0 ? "bg-[#2E9F6B] text-white" : index === 1 ? "bg-ocean text-white shadow-lg shadow-ocean/20" : "border border-navy/10 bg-white text-muted"}`}>{index === 0 ? <BadgeCheck className="h-4.5 w-4.5" /> : index === 1 ? <FlaskConical className="h-4.5 w-4.5" /> : <BadgeCheck className="h-4.5 w-4.5" />}</span>
                  {index < serviceSteps.length - 1 && <span className="h-9 w-px bg-gradient-to-b from-aqua to-navy/10" />}
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3 pb-5 pt-1">
                  <div><p className="text-sm font-bold">{step.label}</p><p className="mt-0.5 text-[11px] text-muted">{step.detail}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${index === 0 ? "bg-[#EAF8F1] text-[#287A55]" : index === 1 ? "bg-seafoam text-ocean" : "bg-slate-100 text-muted"}`}>{step.state}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 rounded-2xl bg-navy p-4 text-white">
            <div className="flex items-end justify-between"><div><p className="text-[10px] text-white/55">Indeks kesiapan mutu</p><strong className="mt-1 block text-2xl">86%</strong></div><span className="rounded-full bg-aqua/15 px-3 py-1 text-[10px] font-bold text-aqua">Siap sertifikasi</span></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-aqua to-gold" /></div>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 top-24 hidden rounded-2xl border border-white/30 bg-white/95 p-3 shadow-xl sm:flex sm:items-center sm:gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF8F1] text-[#2E9F6B]"><BadgeCheck className="h-4.5 w-4.5" /></span>
        <div><p className="text-[10px] text-muted">Status dokumen</p><p className="text-xs font-bold text-navy">Terverifikasi</p></div>
      </div>
    </div>
  );
}
