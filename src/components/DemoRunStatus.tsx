"use client";

import type { DemoRunStatusView } from "@/lib/demo/demoRunState";

interface DemoRunStatusProps {
  status: DemoRunStatusView;
}

const phaseBadge: Record<
  DemoRunStatusView["phase"],
  { label: string; className: string }
> = {
  idle: { label: "IDLE", className: "border-zinc-600 bg-zinc-800 text-zinc-400" },
  between: {
    label: "PAUSE",
    className: "border-violet-600/50 bg-violet-950/50 text-violet-200",
  },
  pipeline: {
    label: "RUNNING",
    className: "border-cyan-500/60 bg-cyan-950/60 text-cyan-200 animate-pulse",
  },
  typing: {
    label: "TYPING",
    className: "border-cyan-600/40 bg-cyan-950/40 text-cyan-300",
  },
  settled: {
    label: "DONE",
    className: "border-emerald-600/50 bg-emerald-950/40 text-emerald-300",
  },
};

const scenarioAccent: Record<
  DemoRunStatusView["scenario"],
  string
> = {
  idle: "border-zinc-700",
  commercial: "border-cyan-600/50",
  distress: "border-amber-600/50",
  custom: "border-zinc-600",
};

export function DemoRunStatus({ status }: DemoRunStatusProps) {
  const badge = phaseBadge[status.phase];
  const progress =
    status.phase === "pipeline" && status.stepIndex > 0
      ? (status.stepIndex / status.stepTotal) * 100
      : status.phase === "settled"
        ? 100
        : 0;

  return (
    <section
      className={`sticky top-0 z-20 rounded-xl border-2 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-md ${scenarioAccent[status.scenario]}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm font-semibold text-zinc-100">
            Scenario {status.scenarioShort}
            <span className="font-normal text-zinc-500">
              {" "}
              · {status.scenarioTitle}
            </span>
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">
          {status.phaseLabel}
        </span>
      </div>

      {status.beatPause && (
        <p className="mt-2 text-sm text-violet-200">{status.beatPause}</p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase text-zinc-600">Active step</p>
          {status.phase === "pipeline" && status.stepName ? (
            <>
              <p className="mt-0.5 text-sm text-zinc-200">
                {status.stepIndex}/{status.stepTotal}{" "}
                <span className="font-mono text-cyan-400/90">
                  {status.stepId}
                </span>{" "}
                — {status.stepName}
              </p>
              {status.stepDetail && (
                <p className="mt-1 text-xs text-zinc-500">{status.stepDetail}</p>
              )}
            </>
          ) : status.phase === "typing" ? (
            <p className="mt-0.5 text-sm text-zinc-300">
              Pipeline complete · typing assistant reply
            </p>
          ) : status.phase === "settled" ? (
            <p className="mt-0.5 text-sm text-zinc-300">
              All {status.stepTotal} gates finished for this scenario
            </p>
          ) : status.phase === "between" ? (
            <p className="mt-0.5 text-sm text-zinc-300">
              Scenario A complete — B queued
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-zinc-500">
              No pipeline running
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-600">Look at</p>
          <p className="mt-0.5 text-sm font-medium text-cyan-300/90">
            {status.watching}
          </p>
        </div>
      </div>

      {(status.phase === "pipeline" || status.phase === "settled") && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between font-mono text-[10px] text-zinc-600">
            <span>Pipeline</span>
            <span>
              {status.phase === "settled"
                ? `${status.stepTotal}/${status.stepTotal}`
                : `${status.stepIndex}/${status.stepTotal}`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
