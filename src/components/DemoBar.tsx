"use client";

import type { DemoScenarioId } from "@/lib/demo/demoRunState";

interface DemoBarProps {
  onSafe: () => void;
  onVulnerable: () => void;
  onFullStory?: () => void;
  onReset: () => void;
  loading: boolean;
  storyComplete?: boolean;
  walkthrough?: boolean;
  activeScenario?: DemoScenarioId;
}

export function DemoBar({
  onSafe,
  onVulnerable,
  onFullStory,
  onReset,
  loading,
  storyComplete,
  walkthrough,
  activeScenario = "idle",
}: DemoBarProps) {
  const aActive = loading && activeScenario === "commercial";
  const bActive = loading && activeScenario === "distress";

  return (
    <section className="rounded-xl border border-cyan-800/40 bg-gradient-to-r from-cyan-950/40 to-zinc-900/80 p-4 shadow-lg shadow-cyan-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Scenarios
        </h2>
        {storyComplete && !loading && (
          <span className="text-[10px] text-emerald-400/90">
            Both scenarios done
          </span>
        )}
      </div>
      {walkthrough && onFullStory && (
        <button
          type="button"
          disabled={loading}
          onClick={onFullStory}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 transition hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50"
        >
          Run both scenarios (commercial → distress)
        </button>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={loading}
          onClick={onSafe}
          className={`rounded-lg px-4 py-3 text-left text-sm font-medium text-white transition disabled:opacity-50 ${
            aActive
              ? "bg-cyan-500 ring-2 ring-cyan-300 ring-offset-2 ring-offset-zinc-900"
              : "bg-cyan-600 hover:bg-cyan-500"
          }`}
        >
          <span className="block text-[10px] uppercase opacity-80">A</span>
          Commercial prompt
          <span className="mt-1 block text-[11px] font-normal opacity-90">
            Stub auction · HyperBooks blocked on claims even when bid is higher
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onVulnerable}
          className={`rounded-lg px-4 py-3 text-left text-sm font-medium text-white transition disabled:opacity-50 ${
            bActive
              ? "bg-amber-700 ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900"
              : "bg-amber-800 hover:bg-amber-700"
          }`}
        >
          <span className="block text-[10px] uppercase opacity-80">B</span>
          Distress prompt
          <span className="mt-1 block text-[11px] font-normal opacity-90">
            Monetisation off · no candidate fetch
          </span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onReset}
          className="rounded-lg border border-zinc-600 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <span className="block text-[10px] uppercase text-zinc-500">Reset</span>
          Clear state
          <span className="mt-1 block text-[11px] text-zinc-500">
            Snapshots, trace, and panels
          </span>
        </button>
      </div>
    </section>
  );
}
