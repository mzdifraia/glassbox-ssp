import type { PromptSafetyResult } from "@/lib/types";

const DISTRESS_PATTERNS = [
  /\boverwhelmed\b/i,
  /\bcan'?t pay\b/i,
  /\bcannot pay\b/i,
  /\bdebt(s)?\b/i,
  /\bbankrupt/i,
  /\bforeclosure\b/i,
  /\bcollections\b/i,
  /\bdefaulting\b/i,
  /\bstruggling financially\b/i,
];

const MEDICAL_PATTERNS = [
  /\bterminal\b/i,
  /\bdiagnosed with\b/i,
  /\bcancer\b/i,
  /\bsuicidal\b/i,
];

const MENTAL_HEALTH_PATTERNS = [
  /\bwant to die\b/i,
  /\bself[- ]harm\b/i,
  /\bsuicide\b/i,
];

const GRIEF_PATTERNS = [/\bjust died\b/i, /\bpassed away\b/i, /\blost my (wife|husband|child)\b/i];

const LEGAL_DISTRESS_PATTERNS = [
  /\barrested\b/i,
  /\bfacing charges\b/i,
  /\bdeportation\b/i,
];

const CHILD_SAFETY_PATTERNS = [/\bmy child is\b/i, /\bminor\b/i, /\bunderage\b/i];

const COMMERCIAL_PATTERNS = [
  /\baccounting software\b/i,
  /\bchoosing\b/i,
  /\bstartup\b/i,
  /\bpayroll\b/i,
  /\bcrm\b/i,
  /\bsoftware for\b/i,
  /\b\d+[- ]person\b/i,
  /\bteam\b/i,
];

export function checkPromptSafety(prompt: string): PromptSafetyResult {
  const normalized = prompt.trim();

  if (CHILD_SAFETY_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "child_safety",
      monetisable: false,
      confidence: 0.94,
      reason: "Child safety context detected — monetisation suppressed",
      policyId: "PROMPT_CHILD_SAFETY_SUPPRESS",
    };
  }

  if (MENTAL_HEALTH_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "mental_health_crisis",
      monetisable: false,
      confidence: 0.97,
      reason: "Mental health crisis signals — monetisation suppressed",
      policyId: "PROMPT_MENTAL_HEALTH_SUPPRESS",
    };
  }

  if (MEDICAL_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "medical_vulnerability",
      monetisable: false,
      confidence: 0.93,
      reason: "Medical vulnerability context — monetisation suppressed",
      policyId: "PROMPT_MEDICAL_SUPPRESS",
    };
  }

  if (GRIEF_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "grief",
      monetisable: false,
      confidence: 0.91,
      reason: "Grief context detected — monetisation suppressed",
      policyId: "PROMPT_GRIEF_SUPPRESS",
    };
  }

  if (LEGAL_DISTRESS_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "legal_distress",
      monetisable: false,
      confidence: 0.9,
      reason: "Legal distress context — monetisation suppressed",
      policyId: "PROMPT_LEGAL_SUPPRESS",
    };
  }

  if (DISTRESS_PATTERNS.some((p) => p.test(normalized))) {
    return {
      category: "financial_distress",
      monetisable: false,
      confidence: 0.96,
      reason: "Vulnerable financial distress context — auction suppressed before ad request",
      policyId: "PROMPT_VULNERABILITY_SUPPRESS",
    };
  }

  const hasCommercial = COMMERCIAL_PATTERNS.some((p) => p.test(normalized));

  if (hasCommercial) {
    return {
      category: "safe_commercial",
      monetisable: true,
      confidence: 0.91,
      reason: "Commercial research intent with no vulnerability signals",
      policyId: "PROMPT_SAFE_COMMERCIAL",
    };
  }

  return {
    category: "safe_commercial",
    monetisable: true,
    confidence: 0.72,
    reason: "No vulnerability signals; proceeding with cautious monetisation check",
    policyId: "PROMPT_DEFAULT_COMMERCIAL",
  };
}
