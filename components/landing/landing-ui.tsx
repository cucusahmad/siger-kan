import Link from "next/link";
import type { ReactNode } from "react";

export type IconName = "arrow" | "brain" | "briefcase" | "building" | "certificate" | "chart" | "check" | "chevron" | "clock" | "document" | "fish" | "flask" | "globe" | "heart" | "lab" | "link" | "mail" | "map" | "menu" | "message" | "phone" | "qr" | "search" | "shield" | "sparkles" | "target" | "users" | "x";

interface IconProps { readonly name: IconName; readonly className?: string; }
const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>, brain: <><path d="M9.5 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 5 13v1a3 3 0 0 0 4.5 2.6M14.5 4a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 19 13v1a3 3 0 0 1-4.5 2.6M9.5 4v16M14.5 4v16M5 9h4.5M14.5 9H19M5 14h4.5M14.5 14H19" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>, building: <><path d="M4 21V5l8-3 8 3v16M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1M2 21h20"/></>,
  certificate: <><circle cx="12" cy="9" r="6"/><path d="m8 14-1 8 5-3 5 3-1-8M9.5 9l1.5 1.5 3.5-3.5"/></>, chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>, check: <path d="m5 12 4 4L19 6"/>, chevron: <path d="m9 18 6-6-6-6"/>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, document: <><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/></>,
  fish: <><path d="M4 12c4-6 10-7 15-2l3-3v10l-3-3c-5 5-11 4-15-2Z"/><circle cx="16" cy="11" r=".7" fill="currentColor"/></>, flask: <><path d="M9 2h6M10 2v6l-6 11a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 8V2M7 16h10"/></>, globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>, heart: <path d="M20 5c-2-2-5-2-8 1-3-3-6-3-8-1-3 3-1 8 8 15 9-7 11-12 8-15Z"/>, lab: <><path d="M7 3h10M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3M7 16h10"/><circle cx="10" cy="13" r="1"/></>, link: <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></>, mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>, map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>, menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>, message: <><path d="M4 4h16v13H8l-4 4zM8 9h8M8 13h5"/></>, phone: <path d="M7 3 4 5c0 8 7 15 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2Z"/>, qr: <><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 15h2v2h-2zM19 15h2v6h-6v-2"/></>, search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, shield: <><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5z"/><path d="m8 12 3 3 5-6"/></>, sparkles: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/></>, target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>, users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>, x: <><path d="M6 6l12 12M18 6 6 18"/></>,
};
export function Icon({ name, className = "h-5 w-5" }: IconProps) { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>; }

interface SectionTitleProps { readonly eyebrow: string; readonly title: string; readonly description?: string; readonly align?: "left" | "center"; readonly light?: boolean; }
export function SectionTitle({ eyebrow, title, description, align = "left", light = false }: SectionTitleProps) {
  return <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl`}><span className={`eyebrow ${light ? "!text-aqua" : ""}`}>{eyebrow}</span><h2 className={`mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12] ${light ? "text-white" : "text-navy"}`}>{title}</h2>{description && <p className={`mt-5 text-base leading-7 sm:text-lg ${light ? "text-white/70" : "text-muted"}`}>{description}</p>}</div>;
}

interface ActionLinkProps { readonly href: string; readonly children: ReactNode; readonly variant?: "primary" | "secondary" | "light"; readonly className?: string; }
export function ActionLink({ href, children, variant = "primary", className = "" }: ActionLinkProps) {
  const styles = { primary: "bg-navy text-white shadow-lg shadow-navy/15 hover:bg-ocean", secondary: "border border-navy/15 bg-white text-navy hover:border-teal/50 hover:bg-seafoam/40", light: "bg-white text-navy hover:bg-seafoam" };
  return <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-teal ${styles[variant]} ${className}`}>{children}</Link>;
}

export const iconBoxClass = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-seafoam text-ocean";
