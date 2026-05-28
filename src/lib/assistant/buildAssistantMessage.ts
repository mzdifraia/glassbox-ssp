import type { AssistantMessage, IntentResult, PromptSafetyResult } from "@/lib/types";

export function buildAssistantMessage(
  prompt: string,
  opts: {
    hasSponsored: boolean;
    apiFailure: boolean;
    intent: IntentResult;
    promptSafety: PromptSafetyResult;
    winnerName?: string;
  }
): AssistantMessage {
  const { hasSponsored, apiFailure, intent, promptSafety, winnerName } = opts;

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
    return {
      role: "assistant",
      content: `For ${extractTeamHint(prompt)} evaluating accounting software, prioritise multi-user access, bank feeds, audit trails, and reporting that scales with headcount. Below is one sponsored option that cleared our safety and transparency checks${winnerName ? ` (${winnerName})` : ""}.`,
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
