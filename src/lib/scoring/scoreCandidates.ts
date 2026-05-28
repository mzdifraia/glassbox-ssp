import type { AdCandidate } from "@/lib/types";

export function computeCompositeScore(candidate: AdCandidate): number {
  return (
    candidate.relevanceScore +
    candidate.bidCents / 10000 +
    candidate.qualityScore
  );
}

export function scoreSurvivors(
  candidates: AdCandidate[]
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

  const winner = eligibleScored[0] ?? null;

  return {
    scored: scored.map((c) => {
      if (c.status !== "eligible") return c;
      if (winner && c.id === winner.id) {
        return { ...c, status: "winner" as const, reason: "Highest eligible composite score" };
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
