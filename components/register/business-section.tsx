import { Building2 } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FloatingInput, FloatingSelect } from "./form-field";
import { businessTypes, commodities, lampungRegions, type RegistrationFormValues } from "./registration-schema";

interface BusinessSectionProps {
  readonly errors: FieldErrors<RegistrationFormValues>;
  readonly register: UseFormRegister<RegistrationFormValues>;
}

const toOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }));

export function BusinessSection({ errors, register }: BusinessSectionProps) {
  return (
    <fieldset>
      <legend className="mb-5 flex items-center gap-3 text-base font-bold text-navy">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-seafoam text-ocean"><Building2 className="h-4.5 w-4.5" /></span>
        Informasi Usaha
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><FloatingInput label="Nama Usaha" autoComplete="organization" error={errors.businessName} registration={register("businessName")} /></div>
        <FloatingSelect label="Jenis Usaha" error={errors.businessType} options={toOptions(businessTypes)} registration={register("businessType")} defaultValue="" />
        <FloatingSelect label="Komoditas Utama" error={errors.commodity} options={toOptions(commodities)} registration={register("commodity")} defaultValue="" />
        <FloatingSelect label="Kabupaten/Kota" error={errors.region} options={toOptions(lampungRegions)} registration={register("region")} defaultValue="" />
        <FloatingInput label="Provinsi" value="Lampung" readOnly aria-readonly="true" className="cursor-not-allowed bg-slate-50 text-navy/75" error={errors.province} registration={register("province")} />
      </div>
    </fieldset>
  );
}
