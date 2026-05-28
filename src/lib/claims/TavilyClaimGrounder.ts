import { tavily } from "@tavily/core";
import type { AdCandidate, ClaimCheckResult } from "@/lib/types";

export async function tavilyGroundClaims(
  candidate: AdCandidate
): Promise<ClaimCheckResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured");
  }

  const client = tavily({ apiKey });
  const checkedClaims = candidate.claims;

  for (const claim of checkedClaims) {
    const query = `Verify advertising claim: "${claim}" for ${candidate.advertiser}`;
    const result = await client.search(query, {
      maxResults: 3,
      searchDepth: "basic",
    });

    const snippets = (result.results ?? [])
      .map((r) => `${r.title} ${r.content}`)
      .join(" ")
      .toLowerCase();

    const hasEvidence =
      snippets.includes("study") ||
      snippets.includes("report") ||
      snippets.includes("verified") ||
      snippets.includes(candidate.advertiser.toLowerCase().split(" ")[0]);

    const isAggressive =
      /\bguaranteed\b/i.test(claim) ||
      /\b\d+%\b/i.test(claim) ||
      /\beliminate\b/i.test(claim);

    if (isAggressive && !hasEvidence) {
      return {
        supported: false,
        checkedClaims,
        reason: `Tavily found insufficient evidence for claim: "${claim}"`,
      };
    }
  }

  return {
    supported: true,
    checkedClaims,
    reason: "Tavily grounding found no blocking issues for checked claims",
  };
}
