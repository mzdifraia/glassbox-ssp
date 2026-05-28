"use client";

import type { PipelineStep } from "@/lib/types";

interface PipelinePanelProps {
  steps: PipelineStep[];
  visibleCount: number;
}

const statusStyles: Record<string, string> = {
  pending: "bg-zinc-700 text-zinc-400",
  passed: "bg-emerald-900/60 text-emerald-300",
  blocked: "bg-amber-900/60 text-amber-300",
  failed: "bg-red-900/60 text-red-300",
  skipped: "bg-zinc-800 text-zinc-500",
};

export function PipelinePanel({ steps, visibleCount }: PipelinePanelProps) {
  const visible = steps.slice(0, visibleCount);

  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Decision pipeline
      </h2>
      <ol className="space-y-2">
        {visible.map((step) => (
          <li
            key={step.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-zinc-200">{step.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{step.reason}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${statusStyles[step.status] ?? statusStyles.pending}`}
              >
                {step.status}
              </span>
              <span className="text-[10px] text-zinc-500">
                {(step.confidence * 100).toFixed(0)}% · {step.latencyMs}ms
              </span>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-sm text-zinc-500">
            Run a prompt to see the pipeline
          </li>
        )}
      </ol>
    </section>
  );
}
