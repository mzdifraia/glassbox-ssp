import type { RunVariance } from "@/lib/supply/runVariance";
import type { AssistantMessage, IntentResult, PromptSafetyResult } from "@/lib/types";

const ACCOUNTING_OPENERS = [
  (team: string) =>
    `For ${team} evaluating accounting software, prioritise multi-user access, bank feeds, audit trails, and reporting that scales with headcount.`,
  (team: string) =>
    `When ${team} is shortlisting accounting tools, weigh close speed, bank reconciliation, role-based approvals, and how reporting holds up as you hire.`,
  (team: string) =>
    `${team} comparing accounting platforms should sanity-check integrations, audit trails, and whether multi-entity support is needed before you buy.`,
] as const;

export function buildAssistantMessage(
  prompt: string,
  opts: {
    hasSponsored: boolean;
    apiFailure: boolean;
    intent: IntentResult;
    promptSafety: PromptSafetyResult;
    winnerName?: string;
    variance?: RunVariance;
  }
): AssistantMessage {
  const { hasSponsored, apiFailure, intent, promptSafety, winnerName, variance } =
    opts;

  if (apiFailure) {
    return {
      role: "assistant",
      content: `I can help you think through: "${truncate(prompt, 100)}". Sponsored placements are temporarily unavailable, so this answer is unbiased.`,
      hasSponsored: false,
    };
  }

  if (!promptSafety.monetisable) {
    return {
      role: "assistant",
      content:
        "I understand you're under real financial pressure. I won't show sponsored financial products here — that wouldn't be appropriate. Consider a nonprofit credit counselor (NFCC), a trusted advisor, or official consumer finance guidance while you work through next steps.",
      hasSponsored: false,
    };
  }

  if (hasSponsored && intent.intent.includes("accounting")) {
    const team = extractTeamHint(prompt);
    const opener = variance
      ? variance.pick(ACCOUNTING_OPENERS)(team)
      : ACCOUNTING_OPENERS[0](team);
    return {
      role: "assistant",
      content: `${opener} Below is one sponsored option that cleared our safety and transparency checks${winnerName ? ` (${winnerName})` : ""}.`,
      hasSponsored: true,
    };
  }

  if (hasSponsored) {
    return {
      role: "assistant",
      content: `Based on your question about ${intent.intent.replace(/\./g, " ")}, here is a sponsored suggestion that passed policy review${winnerName ? ` from ${winnerName}` : ""}.`,
      hasSponsored: true,
    };
  }

  return {
    role: "assistant",
    content:
      "I couldn't find a sponsored placement that passed all safety and relevance checks for this prompt. Here's an unbiased answer based on what you asked.",
    hasSponsored: false,
  };
}

function extractTeamHint(prompt: string): string {
  const match = prompt.match(/(\d+)[- ]?person/i);
  if (match) return `a ${match[1]}-person team`;
  if (/startup/i.test(prompt)) return "a small startup";
  return "your team";
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
