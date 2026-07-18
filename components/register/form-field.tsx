import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: FieldError;
  readonly registration: UseFormRegisterReturn;
  readonly trailing?: React.ReactNode;
}

export function FloatingInput({ label, error, registration, trailing, className = "", ...props }: FloatingInputProps) {
  const errorId = `${registration.name}-error`;

  return (
    <div>
      <div className="group relative">
        <input
          {...registration}
          {...props}
          id={registration.name}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`peer h-15 w-full rounded-2xl border bg-white px-4 pt-4 text-[15px] text-navy outline-none transition placeholder:text-transparent focus:border-ocean focus:ring-4 focus:ring-ocean/8 ${trailing ? "pr-12" : ""} ${error ? "border-[#E63946]/70" : "border-navy/12 hover:border-navy/25"} ${className}`}
        />
        <label
          htmlFor={registration.name}
          className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold text-muted transition-all peer-placeholder-shown:top-[1.15rem] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-ocean"
        >
          {label}
        </label>
        {trailing}
      </div>
      {error && <p id={errorId} className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{error.message}</p>}
    </div>
  );
}

interface SelectOption {
  readonly label: string;
  readonly value: string;
}

interface FloatingSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly error?: FieldError;
  readonly options: readonly SelectOption[];
  readonly registration: UseFormRegisterReturn;
}

export function FloatingSelect({ label, error, options, registration, ...props }: FloatingSelectProps) {
  const errorId = `${registration.name}-error`;

  return (
    <div>
      <div className="relative">
        <select
          {...registration}
          {...props}
          id={registration.name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`peer h-15 w-full appearance-none rounded-2xl border bg-white px-4 pb-1 pt-5 text-[15px] text-navy outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/8 ${error ? "border-[#E63946]/70" : "border-navy/12 hover:border-navy/25"}`}
        >
          <option value="" disabled>Pilih {label.toLowerCase()}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label htmlFor={registration.name} className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold text-muted peer-focus:text-ocean">{label}</label>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      {error && <p id={errorId} className="mt-1.5 px-1 text-xs font-medium text-[#C72F3B]">{error.message}</p>}
    </div>
  );
}
