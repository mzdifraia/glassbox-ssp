import type { AdCandidate } from "@/lib/types";

export interface AdProviderInput {
  prompt: string;
  intent: string;
}

export interface AdProvider {
  getCandidates(input: AdProviderInput): Promise<AdCandidate[]>;
}

export class AdProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdProviderError";
  }
}
