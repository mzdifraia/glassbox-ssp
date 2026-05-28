import type { AdCandidate } from "@/lib/types";
import { AdProviderError, type AdProvider, type AdProviderInput } from "./AdProvider";

const THRAD_API_URL =
  process.env.THRAD_API_URL ?? "https://api.thrad.ai/v1/ads/candidates";

interface ThradApiCandidate {
  id?: string;
  advertiser?: string;
  title?: string;
  body?: string;
  description?: string;
  url?: string;
  category?: string;
  bid_cents?: number;
  bidCents?: number;
  relevance?: number;
  relevance_score?: number;
  quality?: number;
  quality_score?: number;
  claims?: string[];
}

function mapThradCandidate(raw: ThradApiCandidate, index: number): AdCandidate {
  return {
    id: raw.id ?? `thrad_${index}`,
    advertiser: raw.advertiser ?? "Unknown",
    title: raw.title ?? "Sponsored",
    body: raw.body ?? raw.description ?? "",
    url: raw.url ?? "#",
    category: raw.category ?? "general",
    bidCents: raw.bidCents ?? raw.bid_cents ?? 0,
    relevanceScore: raw.relevance_score ?? raw.relevance ?? 0.5,
    qualityScore: raw.quality_score ?? raw.quality ?? 0.5,
    status: "eligible",
    reason: "",
    claims: raw.claims ?? [],
  };
}

export class ThradProvider implements AdProvider {
  async getCandidates(input: AdProviderInput): Promise<AdCandidate[]> {
    const apiKey = process.env.THRAD_API_KEY;
    if (!apiKey) {
      throw new AdProviderError("THRAD_API_KEY is not configured");
    }

    if (process.env.SIMULATE_THRAD_FAILURE === "1") {
      throw new AdProviderError("Simulated Thrad API failure");
    }

    const response = await fetch(THRAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: input.prompt,
        intent: input.intent,
      }),
    });

    if (!response.ok) {
      throw new AdProviderError(
        `Thrad API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      candidates?: ThradApiCandidate[];
    };

    const list = data.candidates ?? [];
    return list.map(mapThradCandidate);
  }
}
