import type { AdCandidate, ClaimCheckResult } from "@/lib/types";

const UNSUPPORTED_PATTERNS = [
  /\bguaranteed\b/i,
  /\b\d+%\s*(reduction|savings|off)\b/i,
  /\beliminate\s+debt\b/i,
  /\bregardless of credit\b/i,
  /\bguaranteed approval\b/i,
];

export async function stubGroundClaims(
  candidate: AdCandidate
): Promise<ClaimCheckResult> {
  const checkedClaims = candidate.claims;
  const unsupported = checkedClaims.filter((claim) =>
    UNSUPPORTED_PATTERNS.some((p) => p.test(claim))
  );

  if (unsupported.length > 0) {
    return {
      supported: false,
      checkedClaims,
      reason: `Unsupported performance claim: "${unsupported[0]}"`,
    };
  }

  return {
    supported: true,
    checkedClaims,
    reason: "All claims passed stub grounding checks",
  };
}
