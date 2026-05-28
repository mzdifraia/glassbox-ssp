import type { AdCandidate, IntentResult, SponsoredContent } from "@/lib/types";

export function buildSponsored(
  winner: AdCandidate | null,
  intent: IntentResult
): SponsoredContent {
  if (!winner) {
    return {
      served: false,
      label: "No sponsored content served",
      headline: "",
      body: "",
      explanation: "No candidates passed all safety gates",
    };
  }

  const because =
    intent.intent.includes("accounting")
      ? "your prompt indicated B2B accounting software research for a small company"
      : `intent ${intent.intent} matched this placement`;

  return {
    served: true,
    label: "Sponsored suggestion",
    headline: winner.title,
    body: `${winner.body}\n\nShown because ${because}.`,
    explanation: `Shown because ${because}.`,
    advertiser: winner.advertiser,
    url: winner.url,
  };
}
