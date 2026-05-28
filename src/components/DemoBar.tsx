"use client";

interface DemoBarProps {
  onSafe: () => void;
  onVulnerable: () => void;
  onReset: () => void;
  loading: boolean;
}

export function DemoBar({
  onSafe,
  onVulnerable,
  onReset,
  loading,
}: DemoBarProps) {
  return (
    <section className="rounded-xl border border-cyan-800/40 bg-gradient-to-r from-cyan-950/40 to-zinc-900/80 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
        Live demo script
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={loading}
          onClick={onSafe}
          className="rounded-lg bg-cyan-600 px-4 py-3 text-left text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          <span className="block text-[10px] uppercase opacity-80">Step 1</span>
          Safe commercial
          <span className="mt-1 block text-[11px] font-normal opacity-90">
            “Everyone can insert an ad — we decide if it should appear.”
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onVulnerable}
          className="rounded-lg bg-amber-800 px-4 py-3 text-left text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <span className="block text-[10px] uppercase opacity-80">Step 2</span>
          Vulnerable intent
          <span className="mt-1 block text-[11px] font-normal opacity-90">
            “High commercial intent — and vulnerability. We suppress.”
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onReset}
          className="rounded-lg border border-zinc-600 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          <span className="block text-[10px] uppercase text-zinc-500">Reset</span>
          Clear demo
          <span className="mt-1 block text-[11px] text-zinc-500">
            Start over before judges
          </span>
        </button>
      </div>
    </section>
  );
}
