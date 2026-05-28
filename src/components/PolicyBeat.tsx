"use client";

interface PolicyBeatProps {
  compact?: boolean;
}

export function PolicyBeat({ compact }: PolicyBeatProps) {
  return (
    <section className="policy-beat relative overflow-hidden rounded-2xl border border-cyan-800/30 px-5 py-4 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.1),transparent)]" />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Publisher SSP
        </p>
        <h2
          className={`mt-1 font-semibold tracking-tight text-zinc-50 ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          Policy runs before an ad can win.
        </h2>
        {!compact && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Run a scenario below — the status bar and pipeline panel show each
            gate live. Step IDs, API routes, and integrations are in the{" "}
            <a
              href="https://github.com/mzdifraia/glassbox-ssp#architecture"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600/90 hover:text-cyan-400"
            >
              README
            </a>{" "}
            or{" "}
            <a
              href="https://glassbox-ssp.vercel.app/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600/90 hover:text-emerald-400"
            >
              health JSON
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
