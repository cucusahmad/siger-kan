import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";

export function LoginIllustration() {
  return (
    <div className="relative mx-auto max-w-md" aria-hidden="true">
      <div className="absolute inset-x-12 top-8 h-52 rounded-full bg-aqua/15 blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/12 bg-white/8 p-5 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqua/20 text-aqua"><Building2 className="h-5 w-5" /></span>
            <div><span className="block h-2.5 w-28 rounded-full bg-white/80" /><span className="mt-2 block h-2 w-20 rounded-full bg-white/25" /></div>
          </div>
          <ShieldCheck className="h-6 w-6 text-aqua" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {["Layanan Mutu", "Sertifikasi", "Klinik Mutu", "Kemitraan"].map((label) => (
            <div key={label} className="rounded-2xl bg-white/8 p-4">
              <CheckCircle2 className="h-4 w-4 text-aqua" />
              <p className="mt-3 text-xs font-semibold text-white/75">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
