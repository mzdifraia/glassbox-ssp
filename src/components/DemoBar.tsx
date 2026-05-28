"use client";

interface DemoBarProps {
  onSafe: () => void;
  onVulnerable: () => void;
  onFullStory?: () => void;
  onReset: () => void;
  loading: boolean;
  loadingLabel?: string;
  storyComplete?: boolean;
  presenter?: boolean;
}

export function DemoBar({
  onSafe,
  onVulnerable,
  onFullStory,
  onReset,
  loading,
  loadingLabel,
  storyComplete,
  presenter,
}: DemoBarProps) {
  return (
    <section className="rounded-xl border border-cyan-800/40 bg-gradient-to-r from-cyan-950/40 to-zinc-900/80 p-4 shadow-lg shadow-cyan-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          {presenter ? "90-second judge path" : "Policy test cases"}
        </h2>
        {loading && (
          <span className="text-[10px] text-cyan-300/80 animate-pulse">
            {loadingLabel ?? "Running pipeline…"}
          </span>
        )}
        {!loading && (
          <span className="text-[10px] text-zinc-600">
            Paced for clarity · <code className="text-zinc-500">?fast=1</code> to skip
          </span>
        )}
        {storyComplete && !loading && (
          <span className="text-[10px] text-emerald-400/90">✓ Both beats recorded</span>
        )}
      </div>
      {presenter && onFullStory && (
        <button
          type="button"
          disabled={loading}
          onClick={onFullStory}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 transition hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50"
        >
          ▶ Run full story (safe → vulnerable)
        </button>
      )}
      <div
        className={`grid gap-3 sm:grid-cols-3 ${presenter && onFullStory ? "mt-3" : "mt-3"}`}
      >
        <button
          type="button"
          disabled={loading}
          onClick={onSafe}
          className="rounded-lg bg-cyan-600 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          <span className="block text-[10px] uppercase opacity-80">Step 1</span>
          Safe commercial
          <span className="mt-1 block text-[11px] font-normal opacity-90">
            Winner may change each run (bid jitter). HyperBooks still blocked by policy.
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onVulnerable}
          className="rounded-lg bg-amber-800 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
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
          className="rounded-lg border border-zinc-600 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
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
