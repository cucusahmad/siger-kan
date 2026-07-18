interface PasswordStrengthProps {
  readonly password: string;
}

const strengthRules = [
  (value: string) => value.length >= 8,
  (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  (value: string) => /[0-9]/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
] as const;

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = strengthRules.filter((rule) => rule(password)).length;
  const labels = ["Belum diisi", "Lemah", "Cukup", "Kuat", "Sangat kuat"] as const;
  const barColors = ["bg-navy/8", "bg-[#E63946]", "bg-gold", "bg-ocean", "bg-[#2E9F6B]"] as const;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span key={segment} className={`h-1 flex-1 rounded-full transition-colors ${segment <= score ? barColors[score] : "bg-navy/8"}`} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>Kekuatan password</span>
        <span className="font-semibold text-navy">{labels[score]}</span>
      </div>
    </div>
  );
}
