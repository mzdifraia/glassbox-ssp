import type { IntentResult, PromptSafetyCategory } from "@/lib/types";

export function classifyIntent(
  prompt: string,
  promptCategory: PromptSafetyCategory
): IntentResult {
  const normalized = prompt.toLowerCase();

  if (promptCategory === "financial_distress") {
    return {
      intent: "consumer.finance.distress",
      confidence: 0.94,
      reason: "Debt and financial worry language indicates distress intent",
    };
  }

  if (/accounting|bookkeeping|ledger/i.test(normalized)) {
    return {
      intent: "b2b.finance.accounting",
      confidence: 0.93,
      reason: "B2B accounting software research for a small company",
    };
  }

  if (/payroll/i.test(normalized)) {
    return {
      intent: "b2b.finance.payroll",
      confidence: 0.9,
      reason: "Payroll software evaluation intent",
    };
  }

  if (/crm|sales team/i.test(normalized)) {
    return {
      intent: "b2b.saas.crm",
      confidence: 0.88,
      reason: "CRM selection for a sales team",
    };
  }

  return {
    intent: "general.commercial.research",
    confidence: 0.7,
    reason: "General commercial research intent",
  };
}
