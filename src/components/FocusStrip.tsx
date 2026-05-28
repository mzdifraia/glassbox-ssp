"use client";

interface FocusStripProps {
  label: string;
  detail?: string | null;
  visible: boolean;
}

/** Single line of truth while the pipeline runs — easier to follow than many panels at once. */
export function FocusStrip({ label, detail, visible }: FocusStripProps) {
  if (!visible) return null;

  return (
    <div
      className="sticky top-0 z-10 rounded-lg border border-cyan-600/40 bg-zinc-950/95 px-4 py-3 shadow-lg shadow-cyan-950/30 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
        Now
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-100">{label}</p>
      {detail && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{detail}</p>
      )}
    </div>
  );
}
