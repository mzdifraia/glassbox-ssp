"use client";

import { downloadTraceJson } from "@/lib/overmind/exportTrace";
import type { PipelineResult, TraceRow } from "@/lib/types";

interface TracePanelProps {
  result: PipelineResult | null;
}

const statusColor: Record<string, string> = {
  pass: "text-emerald-400",
  blocked: "text-amber-400",
  error: "text-red-400",
};

export function TracePanel({ result }: TracePanelProps) {
  const trace: TraceRow[] = result?.trace ?? [];
  const traceId = result?.traceId;

  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Overmind-ready trace log
        </h2>
        {result && (
          <button
            type="button"
            onClick={() => downloadTraceJson(result)}
            className="rounded border border-violet-600/50 px-2 py-1 text-[10px] text-violet-300 hover:bg-violet-950/40"
          >
            Export trace JSON
          </button>
        )}
      </div>
      <p className="mb-3 text-[10px] text-zinc-500">
        Open-source Overmind eval: export traces + see{" "}
        <code className="text-zinc-400">overmind/policies.md</code> and{" "}
        <code className="text-zinc-400">overmind/dataset.json</code>
        {traceId ? (
          <>
            {" "}
            · Trace ID:{" "}
            <span className="font-mono text-cyan-500">{traceId}</span>
          </>
        ) : null}
      </p>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-500">
              <th className="py-1 pr-2">Step</th>
              <th className="py-1 pr-2">Status</th>
              <th className="py-1 pr-2 hidden sm:table-cell">Input</th>
              <th className="py-1">Output</th>
            </tr>
          </thead>
          <tbody>
            {trace.map((row) => (
              <tr key={row.step} className="border-b border-zinc-800/80">
                <td className="py-2 pr-2 font-mono text-zinc-300">{row.step}</td>
                <td
                  className={`py-2 pr-2 uppercase ${statusColor[row.status] ?? ""}`}
                >
                  {row.status}
                </td>
                <td className="hidden py-2 pr-2 text-zinc-500 sm:table-cell">
                  {row.inputSummary}
                </td>
                <td className="py-2 text-zinc-400">{row.outputSummary}</td>
              </tr>
            ))}
            {trace.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-zinc-500">
                  Run pipeline to emit trace rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
