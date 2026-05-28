"use client";

import { sortCandidatesForDisplay } from "@/lib/demo/sortCandidatesForDisplay";
import type { AdCandidate } from "@/lib/types";

interface CandidateAuctionProps {
  candidates: AdCandidate[];
  message?: string;
  panelSubtitle?: string;
  highlight?: boolean;
}

const statusChip: Record<string, string> = {
  eligible: "border-zinc-500 text-zinc-300",
  blocked: "border-red-600 text-red-300",
  winner: "border-cyan-500 text-cyan-300",
  lost: "border-zinc-600 text-zinc-500",
};

export function CandidateAuction({
  candidates,
  message,
  panelSubtitle,
  highlight,
}: CandidateAuctionProps) {
  const sorted = sortCandidatesForDisplay(candidates);
  const winner = sorted.find((c) => c.status === "winner");
  const winnerBid = winner?.bidCents ?? 0;

  return (
    <section
      className={`rounded-xl border p-4 transition-colors ${
        highlight
          ? "border-cyan-500/50 bg-cyan-950/20 ring-1 ring-cyan-500/20"
          : "border-zinc-700/60 bg-zinc-900/80"
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Candidate auction
      </h2>
      {panelSubtitle && (
        <p className="mt-0.5 mb-3 font-mono text-[10px] text-zinc-500">
          {panelSubtitle}
        </p>
      )}
      {!panelSubtitle && <div className="mb-3" />}
      {message && (
        <p className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          {message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((c) => {
          const outbidWinnerBlocked =
            c.status === "blocked" && winner && c.bidCents > winnerBid;

          return (
            <article
              key={c.id}
              className={`rounded-lg border p-3 transition-all duration-300 ${
                c.status === "winner"
                  ? "winner-glow border-cyan-500/70 bg-cyan-950/25"
                  : outbidWinnerBlocked
                    ? "animate-moment-in border-amber-600/50 bg-amber-950/25"
                    : c.status === "blocked"
                      ? "border-red-900/40 bg-red-950/10"
                      : "border-zinc-700 bg-zinc-950/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-zinc-100">{c.advertiser}</div>
                  <div className="text-xs text-zinc-500">{c.title}</div>
                </div>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[10px] uppercase ${statusChip[c.status]}`}
                >
                  {c.status}
                </span>
              </div>
              {outbidWinnerBlocked && (
                <p className="mt-2 rounded border border-amber-700/50 bg-amber-950/40 px-2 py-1 text-[10px] font-medium text-amber-200">
                  Higher bid than winner — still blocked by policy
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{c.body}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                <span className={outbidWinnerBlocked ? "font-semibold text-amber-300" : ""}>
                  bid ${(c.bidCents / 100).toFixed(2)}
                </span>
                <span>rel {(c.relevanceScore * 100).toFixed(0)}%</span>
                <span>qual {(c.qualityScore * 100).toFixed(0)}%</span>
                {c.compositeScore != null && (
                  <span>score {c.compositeScore.toFixed(3)}</span>
                )}
              </div>
              {c.claims.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[10px] text-zinc-500">
                  {c.claims.map((claim) => (
                    <li key={claim}>• {claim}</li>
                  ))}
                </ul>
              )}
              {c.reason && (
                <p className="mt-2 text-[10px] text-amber-400/90">{c.reason}</p>
              )}
            </article>
          );
        })}
        {candidates.length === 0 && !message && (
          <p className="text-sm text-zinc-500">No candidates yet</p>
        )}
      </div>
    </section>
  );
}
