import type { AdCandidate, ClaimCheckResult } from "@/lib/types";
import { hasHardBlockedClaim } from "./hardClaimBlock";
import { stubGroundClaims } from "./StubClaimGrounder";
import { tavilyGroundClaims } from "./TavilyClaimGrounder";

export async function groundClaimsWithTavily(
  candidate: AdCandidate
): Promise<ClaimCheckResult> {
  const hardClaim = hasHardBlockedClaim(candidate);
  if (hardClaim) {
    return {
      supported: false,
      checkedClaims: candidate.claims,
      reason: `Unsupported performance claim (policy gate): "${hardClaim}"`,
    };
  }

  if (process.env.TAVILY_API_KEY?.trim()) {
    try {
      return await tavilyGroundClaims(candidate);
    } catch {
      return stubGroundClaims(candidate);
    }
  }

  return stubGroundClaims(candidate);
}
