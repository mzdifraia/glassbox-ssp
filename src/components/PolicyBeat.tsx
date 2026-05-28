"use client";

interface PolicyBeatProps {
  compact?: boolean;
}

export function PolicyBeat({ compact }: PolicyBeatProps) {
  return (
    <section className="policy-beat relative overflow-hidden rounded-2xl border border-cyan-800/30 px-5 py-5 sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.15),transparent)]" />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Sell-side & measurement
        </p>
        <h2
          className={`mt-2 font-semibold tracking-tight text-zinc-50 ${
            compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
          }`}
        >
          Everyone can insert an ad into a chat.{" "}
          <span className="text-cyan-300">
            GlassBox decides if it should appear.
          </span>
        </h2>
        {!compact && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Hard safety gates run before scoring. A higher bid cannot override
            policy — vulnerability suppresses the auction, and unsupported claims
            never reach the winner slot.
          </p>
        )}
      </div>
    </section>
  );
}
