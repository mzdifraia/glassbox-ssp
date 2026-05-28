import { groundClaimsWithTavily } from "@/lib/claims/groundClaims";
import { checkCandidateSafety } from "@/lib/safety/candidateSafety";
import { scoreSurvivors } from "@/lib/scoring/scoreCandidates";
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
}

export async function processCandidates(
  candidates: AdCandidate[],
  context: {
    intent: string;
    promptCategory: PromptSafetyCategory;
  }
): Promise<ProcessCandidatesResult> {
  const claimChecks = new Map<string, ClaimCheckResult>();

  const evaluated = await Promise.all(
    candidates.map(async (candidate) => {
      const claimCheck = await groundClaimsWithTavily(candidate);
      claimChecks.set(candidate.id, claimCheck);

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
    })
  );

  const blockedCount = evaluated.filter((c) => c.status === "blocked").length;
  const { scored: rawScored, winner } = scoreSurvivors(evaluated);

  const scored = winner
    ? rawScored.map((c) => enrichBlockedBidReason(c, winner))
    : rawScored;

  return { scored, winner, blockedCount, claimChecks };
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
