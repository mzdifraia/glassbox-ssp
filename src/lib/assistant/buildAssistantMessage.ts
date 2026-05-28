import type { RunVariance } from "@/lib/supply/runVariance";
import type { AssistantMessage, IntentResult, PromptSafetyResult } from "@/lib/types";

const ACCOUNTING_OPENERS = [
  (team: string) =>
    `For ${team}, I'd compare bank feeds, role-based approvals, and audit trails before you pick a vendor.`,
  (team: string) =>
    `If ${team} is shopping for accounting tools, reconciliation speed and multi-user access matter more than feature count.`,
  (team: string) =>
    `${team} should confirm reporting still works as headcount grows — that's usually where cheap tools break.`,
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
      content: `Ads are offline right now, so this is unsponsored. Your question was: "${truncate(prompt, 100)}"`,
      hasSponsored: false,
    };
  }

  if (!promptSafety.monetisable) {
    return {
      role: "assistant",
      content:
        "This looks like financial distress, so we are not running an ad auction. If you need help, NFCC (nfcc.org) lists nonprofit credit counselors; your bank or a licensed advisor may also be useful.",
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
      content: `${opener} Sponsored (passed policy)${winnerName ? `: ${winnerName}` : ""}.`,
      hasSponsored: true,
    };
  }

  if (hasSponsored) {
    return {
      role: "assistant",
      content: `Sponsored option for ${intent.intent.replace(/\./g, " ")}${winnerName ? ` — ${winnerName}` : ""}. It cleared the same gates as everything else in the auction.`,
      hasSponsored: true,
    };
  }

  return {
    role: "assistant",
    content:
      "Nothing in the auction passed safety and relevance checks, so there is no sponsored slot in this reply.",
    hasSponsored: false,
  };
}

function extractTeamHint(prompt: string): string {
  const match = prompt.match(/(\d+)[- ]?person/i);
  if (match) return `a ${match[1]}-person team`;
  if (/startup/i.test(prompt)) return "your startup";
  return "your team";
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
