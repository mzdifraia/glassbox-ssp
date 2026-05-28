"use client";

interface PolicyBeatProps {
  compact?: boolean;
}

export function PolicyBeat({ compact }: PolicyBeatProps) {
  return (
    <section className="policy-beat relative overflow-hidden rounded-2xl border border-cyan-800/30 px-5 py-5 sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]" />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Publisher SSP · in-chat ads
        </p>
        <h2
          className={`mt-2 font-semibold tracking-tight text-zinc-50 ${
            compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          }`}
        >
          Policy runs on every prompt before an ad can win.
        </h2>
        {!compact && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Ten gated steps: safety, intent, supply fetch, claim grounding (Tavily
            when configured), candidate checks, scoring, receipt, attribution, trace.
            Blocks happen in code — not as score penalties.
          </p>
        )}
      </div>
    </section>
  );
}
