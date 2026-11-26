import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card rounded-2xl border border-brand-100 bg-white/90 p-5 backdrop-blur-sm ${className}`}>
      {title && <h2 className="font-semibold text-brand-950">{title}</h2>}
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      {(title || subtitle) && <div className="mt-4" />}
      {children}
    </section>
  );
}

export function Stat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="surface rounded-2xl border border-brand-100 bg-white/90 px-4 py-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-brand-950">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="surface rounded-2xl border border-dashed border-brand-100 bg-white/80 p-8 text-center text-slate-500">
      {children}
    </div>
  );
}
