import { getStubCandidates } from "@/data/stubCandidates";
import type { AdCandidate } from "@/lib/types";
import type { AdProvider, AdProviderInput } from "./AdProvider";

export class StubAdProvider implements AdProvider {
  async getCandidates(input: AdProviderInput): Promise<AdCandidate[]> {
    const all = getStubCandidates();

    if (input.intent.includes("accounting")) {
      return all.map((c) => ({
        ...c,
        status: "eligible" as const,
        reason: "",
      }));
    }

    return all.map((c) => ({ ...c, status: "eligible" as const, reason: "" }));
  }
}
