"use client";

import type { PipelineResult } from "@/lib/types";

interface CompareSummaryProps {
  safe: PipelineResult | null;
  vulnerable: PipelineResult | null;
}

export function CompareSummary({ safe, vulnerable }: CompareSummaryProps) {
  if (!safe && !vulnerable) return null;

  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Safe vs suppressed
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-3 text-sm">
          <div className="text-[10px] uppercase text-cyan-500">Safe commercial</div>
          {safe ? (
            <ul className="mt-2 space-y-1 text-zinc-300">
              <li>Ad request: {safe.receipt.adRequestMade ? "Yes" : "No"}</li>
              <li>Decision: {safe.receipt.placementDecision}</li>
              <li>Winner: {safe.receipt.winnerAdvertiser ?? "—"}</li>
            </ul>
          ) : (
            <p className="mt-2 text-zinc-500">Run step 1</p>
          )}
        </div>
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-sm">
          <div className="text-[10px] uppercase text-amber-500">Vulnerable</div>
          {vulnerable ? (
            <ul className="mt-2 space-y-1 text-zinc-300">
              <li>Ad request: {vulnerable.receipt.adRequestMade ? "Yes" : "No"}</li>
              <li>Decision: {vulnerable.receipt.placementDecision}</li>
              <li>Stored: suppression event only</li>
            </ul>
          ) : (
            <p className="mt-2 text-zinc-500">Run step 2</p>
          )}
        </div>
      </div>
    </section>
  );
}
