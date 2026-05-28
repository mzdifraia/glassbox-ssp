import { groundClaimsWithTavily } from "@/lib/claims/groundClaims";
import { checkCandidateSafety } from "@/lib/safety/candidateSafety";
import { scoreSurvivors } from "@/lib/scoring/scoreCandidates";
import type { RunVariance } from "@/lib/supply/runVariance";
import type {
  AdCandidate,
  ClaimCheckResult,
  PromptSafetyCategory,
} from "@/lib/types";

export interface ProcessCandidatesResult {
  scored: AdCandidate[];
  winner: AdCandidate | null;
  blockedCount: number;
  claimChecks: Map<string, ClaimCheckResult>;
  claimGroundingMs: number;
  candidateSafetyMs: number;
  scoringMs: number;
}

export async function processCandidates(
  candidates: AdCandidate[],
  context: {
    intent: string;
    promptCategory: PromptSafetyCategory;
    variance?: RunVariance;
  }
): Promise<ProcessCandidatesResult> {
  const claimChecks = new Map<string, ClaimCheckResult>();

  const claimStart = Date.now();
  const withClaims = await Promise.all(
    candidates.map(async (candidate) => {
      const claimCheck = await groundClaimsWithTavily(candidate);
      claimChecks.set(candidate.id, claimCheck);
      return { candidate, claimCheck };
    })
  );
  const claimGroundingMs = Date.now() - claimStart;

  const safetyStart = Date.now();
  const evaluated = withClaims.map(({ candidate, claimCheck }) => {
    const safety = checkCandidateSafety(candidate, claimCheck, {
      intent: context.intent,
      promptCategory: context.promptCategory,
    });

    if (!safety.safe) {
      return {
        ...candidate,
        status: "blocked" as const,
        reason:
          safety.reason === "unsupported_claim"
            ? "Unsupported performance claim"
            : safety.detail,
      };
    }

    return { ...candidate, status: "eligible" as const, reason: "" };
  });
  const candidateSafetyMs = Date.now() - safetyStart;

  const blockedCount = evaluated.filter((c) => c.status === "blocked").length;

  const scoreStart = Date.now();
  const { scored: rawScored, winner } = scoreSurvivors(
    evaluated,
    context.variance
  );
  const scoringMs = Date.now() - scoreStart;

  const scored = winner
    ? rawScored.map((c) => enrichBlockedBidReason(c, winner))
    : rawScored;

  return {
    scored,
    winner,
    blockedCount,
    claimChecks,
    claimGroundingMs,
    candidateSafetyMs,
    scoringMs,
  };
}

function enrichBlockedBidReason(
  c: AdCandidate,
  winner: AdCandidate
): AdCandidate {
  if (
    c.status === "blocked" &&
    c.bidCents > winner.bidCents &&
    c.reason.toLowerCase().includes("unsupported")
  ) {
    return {
      ...c,
      reason: `Bid $${(c.bidCents / 100).toFixed(2)} beats winner $${(winner.bidCents / 100).toFixed(2)} — blocked by policy, not score`,
    };
  }
  return c;
}
