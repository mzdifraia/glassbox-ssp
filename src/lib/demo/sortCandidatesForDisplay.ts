import type { AdCandidate } from "@/lib/types";

/** Surfaces winner first, then dramatic policy blocks (e.g. outbid-but-blocked). */
export function sortCandidatesForDisplay(candidates: AdCandidate[]): AdCandidate[] {
  const winner = candidates.find((c) => c.status === "winner");
  const winnerBid = winner?.bidCents ?? 0;

  return [...candidates].sort((a, b) => {
    const rank = (c: AdCandidate) => {
      if (c.status === "winner") return 0;
      if (
        c.status === "blocked" &&
        winner &&
        c.bidCents > winnerBid
      ) {
        return 1;
      }
      if (c.status === "blocked") return 2;
      if (c.status === "eligible") return 3;
      return 4;
    };
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return b.bidCents - a.bidCents;
  });
}
