"use client";

import type { AttributionEvent } from "@/lib/types";

interface AttributionLogProps {
  events: AttributionEvent[];
  impressionId?: string;
  onSimulateClick: () => void;
  onSimulateConversion: () => void;
}

export function AttributionLog({
  events,
  impressionId,
  onSimulateClick,
  onSimulateConversion,
}: AttributionLogProps) {
  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Attribution log
      </h2>
      {impressionId && (
        <p className="mb-2 font-mono text-[10px] text-zinc-500">
          Session impression: {impressionId}
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSimulateClick}
          className="rounded-lg border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Simulate click
        </button>
        <button
          type="button"
          onClick={onSimulateConversion}
          className="rounded-lg border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Simulate conversion
        </button>
      </div>
      <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
        {events.length === 0 ? (
          <li className="text-zinc-500">No events yet</li>
        ) : (
          events.map((e) => (
            <li
              key={e.id}
              className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-zinc-400"
            >
              <span className="text-cyan-500">{e.type}</span>
              <span className="text-zinc-600"> · </span>
              <span className="text-zinc-500">{e.timestamp}</span>
              {e.detail && (
                <span className="block text-zinc-500">{e.detail}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
