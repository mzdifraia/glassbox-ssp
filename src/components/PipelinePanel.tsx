"use client";

import { Panel } from "@/components/ui/Panel";
import { PIPELINE_STEP_NAMES } from "@/lib/pipeline/constants";
import type { PipelineStep } from "@/lib/types";
import { useEffect, useRef } from "react";

interface PipelinePanelProps {
  steps: PipelineStep[];
  visibleCount: number;
  loading?: boolean;
  durationMs?: number;
  paced?: boolean;
}

const statusStyles: Record<string, string> = {
  pending: "bg-zinc-700 text-zinc-400",
  passed: "bg-emerald-900/60 text-emerald-300",
  blocked: "bg-amber-900/60 text-amber-300",
  failed: "bg-red-900/60 text-red-300",
  skipped: "bg-zinc-800 text-zinc-500",
};

export function PipelinePanel({
  steps,
  visibleCount,
  loading,
  durationMs,
  paced,
}: PipelinePanelProps) {
  const visible = steps.slice(0, visibleCount);
  const activeIndex = loading ? visible.length - 1 : visible.length - 1;
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (loading && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [loading, visible.length]);
  const totalSteps = PIPELINE_STEP_NAMES.length;
  const progressPct = Math.min(
    100,
    Math.round((visible.length / totalSteps) * 100)
  );

  return (
    <Panel
      title="Decision pipeline"
      subtitle={
        durationMs != null
          ? `Wall-clock ${(durationMs / 1000).toFixed(1)}s · step latencyMs from Date.now()`
          : "10 gates · blocks are not score penalties"
      }
    >
      {(loading || visible.length > 0) && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
            <span>Pipeline progress</span>
            <span>
              {visible.length}/{totalSteps} gates
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${loading ? Math.max(progressPct, 8) : progressPct}%` }}
            />
          </div>
        </div>
      )}
      <ol
        className={`space-y-2 ${paced && loading ? "max-h-72 overflow-y-auto pr-1" : ""}`}
      >
        {visible.map((step, i) => (
          <li
            key={step.id}
            ref={i === activeIndex && loading ? activeRef : undefined}
            className={`animate-step-enter flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-300 ${
              i === activeIndex && loading
                ? "border-cyan-500/60 bg-cyan-950/40 ring-1 ring-cyan-500/30"
                : paced && loading && i < activeIndex
                  ? "border-zinc-800/60 bg-zinc-950/40 opacity-55"
                  : "border-zinc-800 bg-zinc-950/60"
            }`}
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
    </Panel>
  );
}
