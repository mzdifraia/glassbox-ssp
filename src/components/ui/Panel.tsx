import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  highlight?: boolean;
  className?: string;
}

export function Panel({
  title,
  subtitle,
  children,
  highlight,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-cyan-800/40 bg-gradient-to-b from-cyan-950/30 to-zinc-900/80"
          : "border-zinc-700/60 bg-zinc-900/80"
      } ${className}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}
