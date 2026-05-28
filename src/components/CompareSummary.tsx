"use client";

import type { PipelineResult } from "@/lib/types";

interface CompareSummaryProps {
  safe: PipelineResult | null;
  vulnerable: PipelineResult | null;
}

export function CompareSummary({ safe, vulnerable }: CompareSummaryProps) {
  if (!safe && !vulnerable) return null;

  const storyComplete = Boolean(safe && vulnerable);

  return (
    <section
      className={`rounded-xl border bg-zinc-900/80 p-4 transition-all duration-500 ${
        storyComplete
          ? "animate-story-complete border-cyan-700/50 shadow-lg shadow-cyan-950/25"
          : "border-zinc-700/60"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Safe vs suppressed
        </h2>
        {storyComplete && (
          <span className="rounded-full border border-emerald-600/40 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
            Full story complete
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-4 text-sm transition-all ${
            safe
              ? "border-cyan-600/50 bg-cyan-950/30"
              : "border-cyan-800/30 bg-cyan-950/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600/30 text-xs font-bold text-cyan-300">
              1
            </span>
            <span className="text-[10px] font-semibold uppercase text-cyan-400">
              Safe commercial
            </span>
          </div>
          {safe ? (
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-bold text-emerald-400">
                {safe.receipt.placementDecision}
              </p>
              <p className="text-zinc-200">
                Winner:{" "}
                <strong>{safe.receipt.winnerAdvertiser ?? "—"}</strong>
              </p>
              <p className="text-xs text-amber-200/90">
                HyperBooks: blocked by policy
                {safe.candidates.find((c) => c.id === "hyperbooks")?.bidCents &&
                safe.candidates.find((c) => c.status === "winner")?.bidCents
                  ? ` ($${(safe.candidates.find((c) => c.id === "hyperbooks")!.bidCents / 100).toFixed(2)} bid did not win)`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-zinc-500">Run step 1</p>
          )}
        </div>

        <div
          className={`rounded-lg border p-4 text-sm transition-all ${
            vulnerable
              ? "border-amber-600/50 bg-amber-950/30"
              : "border-amber-800/30 bg-amber-950/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/40 text-xs font-bold text-amber-200">
              2
            </span>
            <span className="text-[10px] font-semibold uppercase text-amber-400">
              Vulnerable intent
            </span>
          </div>
          {vulnerable ? (
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-bold text-amber-300">
                {vulnerable.receipt.placementDecision}
              </p>
              <p className="text-zinc-300">No ad request — suppressed upstream</p>
              <p className="text-xs text-zinc-500">
                Only suppression logged to attribution
              </p>
            </div>
          ) : (
            <p className="mt-3 text-zinc-500">Run step 2</p>
          )}
        </div>
      </div>

      {storyComplete && (
        <p className="mt-4 text-center text-sm text-zinc-400">
          Same publisher stack —{" "}
          <span className="text-cyan-300">monetise when safe</span>,{" "}
          <span className="text-amber-300">suppress when vulnerable</span>.
        </p>
      )}
    </section>
  );
}
