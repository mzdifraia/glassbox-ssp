import type { PipelineResult } from "@/lib/types";

export interface PolicyMoment {
  id: string;
  tone: "policy-win" | "suppression";
  headline: string;
  detail: string;
  metric?: string;
}

export function detectPolicyMoment(
  result: PipelineResult | null
): PolicyMoment | null {
  if (!result) return null;

  if (result.auctionSuppressed) {
    return {
      id: "suppression",
      tone: "suppression",
      headline: "PROMPT_VULNERABILITY_SUPPRESS",
      detail: result.promptSafety.reason,
      metric: "Ad request: No",
    };
  }

  const hyper = result.candidates.find((c) => c.id === "hyperbooks");
  const winner = result.candidates.find((c) => c.status === "winner");

  if (
    hyper?.status === "blocked" &&
    winner &&
    hyper.bidCents > winner.bidCents
  ) {
    return {
      id: "hyperbooks",
      tone: "policy-win",
      headline: "Higher bid blocked (CANDIDATE_UNSUPPORTED_CLAIM)",
      detail: `HyperBooks bid $${(hyper.bidCents / 100).toFixed(2)} vs winner $${(winner.bidCents / 100).toFixed(2)} — claim gate fired before scoring.`,
      metric: `Winner: ${winner.advertiser} at $${(winner.bidCents / 100).toFixed(2)}`,
    };
  }

  if (hyper?.status === "blocked") {
    return {
      id: "hyperbooks-claim",
      tone: "policy-win",
      headline: "Unsafe claims blocked before scoring",
      detail: hyper.reason || "Unsupported performance claim",
      metric: winner ? `Winner: ${winner.advertiser}` : undefined,
    };
  }

  return null;
}
