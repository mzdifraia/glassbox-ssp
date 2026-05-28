import type {
  AdCandidate,
  CandidateSafetyResult,
  ClaimCheckResult,
  PromptSafetyCategory,
} from "@/lib/types";

const MANIPULATIVE_PATTERNS = [
  /\bact now\b/i,
  /\blimited time\b/i,
  /\bdon'?t miss\b/i,
  /\burgent\b/i,
];

export function checkCandidateSafety(
  candidate: AdCandidate,
  claimCheck?: ClaimCheckResult,
  options?: {
    intent?: string;
    promptCategory?: PromptSafetyCategory;
  }
): CandidateSafetyResult {
  if (claimCheck && !claimCheck.supported) {
    return {
      safe: false,
      reason: "unsupported_claim",
      detail: claimCheck.reason,
      policyId: "CANDIDATE_UNSUPPORTED_CLAIM",
    };
  }

  if (candidate.category.startsWith("consumer.finance.debt")) {
    return {
      safe: false,
      reason: "unsafe_category",
      detail: "Debt relief category blocked in publisher policy",
      policyId: "CANDIDATE_UNSAFE_CATEGORY",
    };
  }

  if (
    options?.intent?.includes("accounting") &&
    candidate.category === "b2b.finance.tax" &&
    candidate.relevanceScore < 0.5
  ) {
    return {
      safe: false,
      reason: "low_relevance",
      detail: "Category mismatch for accounting software research",
      policyId: "CANDIDATE_LOW_RELEVANCE",
    };
  }

  if (MANIPULATIVE_PATTERNS.some((p) => p.test(candidate.body))) {
    return {
      safe: false,
      reason: "manipulative_wording",
      detail: "Manipulative urgency language detected",
      policyId: "CANDIDATE_MANIPULATIVE",
    };
  }

  if (candidate.id === "counteasy" && options?.intent?.includes("accounting")) {
    return {
      safe: false,
      reason: "low_relevance",
      detail: "Invoicing-focused product mismatched to accounting software intent",
      policyId: "CANDIDATE_CATEGORY_MISMATCH",
    };
  }

  if (candidate.relevanceScore < 0.35) {
    return {
      safe: false,
      reason: "low_relevance",
      detail: "Relevance below minimum threshold",
      policyId: "CANDIDATE_LOW_RELEVANCE",
    };
  }

  return {
    safe: true,
    reason: "passed",
    detail: "Passed all candidate safety checks",
    policyId: "CANDIDATE_PASSED",
  };
}
