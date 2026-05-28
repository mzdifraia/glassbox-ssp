import type { AdCandidate } from "@/lib/types";

const HARD_BLOCK_PATTERNS = [
  /\bguaranteed\b/i,
  /\b\d+%\s*(reduction|savings|off|costs?)\b/i,
  /\beliminate\s+debt\b/i,
  /\bregardless of credit\b/i,
  /\bguaranteed approval\b/i,
];

export function hasHardBlockedClaim(candidate: AdCandidate): string | null {
  for (const claim of candidate.claims) {
    if (HARD_BLOCK_PATTERNS.some((p) => p.test(claim))) {
      return claim;
    }
  }
  return null;
}
