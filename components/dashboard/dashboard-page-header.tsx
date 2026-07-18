import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
}

export function DashboardPageHeader({ eyebrow, title, description, actions }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-ocean">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-[-.035em] text-navy sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
