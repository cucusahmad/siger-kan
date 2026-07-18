import { Eye, EyeOff, UserRound } from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { FloatingInput } from "./form-field";
import { PasswordStrength } from "./password-strength";
import type { RegistrationFormValues } from "./registration-schema";

interface AccountSectionProps {
  readonly errors: FieldErrors<RegistrationFormValues>;
  readonly register: UseFormRegister<RegistrationFormValues>;
  readonly showConfirmPassword: boolean;
  readonly showPassword: boolean;
  readonly toggleConfirmPassword: () => void;
  readonly togglePassword: () => void;
  readonly watch: UseFormWatch<RegistrationFormValues>;
}

interface PasswordToggleProps {
  readonly label: string;
  readonly shown: boolean;
  readonly onClick: () => void;
}

function PasswordToggle({ label, shown, onClick }: PasswordToggleProps) {
  const Icon = shown ? EyeOff : Eye;
  return <button type="button" onClick={onClick} aria-label={label} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-seafoam hover:text-ocean focus-visible:outline-2 focus-visible:outline-ocean"><Icon className="h-4.5 w-4.5" /></button>;
}

export function AccountSection({ errors, register, showConfirmPassword, showPassword, toggleConfirmPassword, togglePassword, watch }: AccountSectionProps) {
  const password = watch("password") ?? "";

  return (
    <fieldset>
      <legend className="mb-5 flex items-center gap-3 text-base font-bold text-navy">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-seafoam text-ocean"><UserRound className="h-4.5 w-4.5" /></span>
        Informasi Akun
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><FloatingInput label="Nama Lengkap" autoComplete="name" error={errors.fullName} registration={register("fullName")} /></div>
        <FloatingInput label="Email" type="email" autoComplete="email" error={errors.email} registration={register("email")} />
        <FloatingInput label="Nomor Handphone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} registration={register("phone")} />
        <div>
          <FloatingInput label="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" error={errors.password} registration={register("password")} trailing={<PasswordToggle shown={showPassword} onClick={togglePassword} label={showPassword ? "Sembunyikan password" : "Tampilkan password"} />} />
          <PasswordStrength password={password} />
        </div>
        <FloatingInput label="Konfirmasi Password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" error={errors.confirmPassword} registration={register("confirmPassword")} trailing={<PasswordToggle shown={showConfirmPassword} onClick={toggleConfirmPassword} label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"} />} />
      </div>
    </fieldset>
  );
}
