import type { RunVariance } from "@/lib/supply/runVariance";
import type { AdCandidate } from "@/lib/types";

const TIE_EPSILON = 0.035;

export function computeCompositeScore(candidate: AdCandidate): number {
  return (
    candidate.relevanceScore +
    candidate.bidCents / 10000 +
    candidate.qualityScore
  );
}

export function scoreSurvivors(
  candidates: AdCandidate[],
  variance?: RunVariance
): { scored: AdCandidate[]; winner: AdCandidate | null } {
  const eligible = candidates.filter((c) => c.status === "eligible");

  if (eligible.length === 0) {
    return { scored: candidates, winner: null };
  }

  const scored = candidates.map((c) => {
    if (c.status !== "eligible") return c;
    return { ...c, compositeScore: computeCompositeScore(c) };
  });

  const eligibleScored = scored
    .filter((c) => c.status === "eligible")
    .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));

  let winner = eligibleScored[0] ?? null;

  if (
    winner &&
    eligibleScored.length >= 2 &&
    variance &&
    variance.mode !== "frozen"
  ) {
    const second = eligibleScored[1]!;
    const gap =
      (winner.compositeScore ?? 0) - (second.compositeScore ?? 0);
    if (gap < TIE_EPSILON) {
      const w1 = winner.compositeScore ?? 0;
      const w2 = second.compositeScore ?? 0;
      winner = variance.next() < w1 / (w1 + w2) ? winner : second;
    }
  }

  return {
    scored: scored.map((c) => {
      if (c.status !== "eligible") return c;
      if (winner && c.id === winner.id) {
        const closeRace =
          eligibleScored.length >= 2 &&
          (eligibleScored[0]!.compositeScore ?? 0) -
            (eligibleScored[1]!.compositeScore ?? 0) <
            TIE_EPSILON;
        return {
          ...c,
          status: "winner" as const,
          reason: closeRace
            ? "Won close auction (composite within tie band)"
            : "Highest eligible composite score",
        };
      }
      return {
        ...c,
        status: "lost" as const,
        reason: winner
          ? "Lower composite score than winner"
          : "No winner selected",
      };
    }),
    winner,
  };
}
