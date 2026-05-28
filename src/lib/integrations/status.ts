import type { IntegrationStatus } from "@/lib/types";

export type { IntegrationStatus };

export function getIntegrationStatus(): IntegrationStatus {
  const hasTavily = Boolean(process.env.TAVILY_API_KEY?.trim());
  const hasThrad = Boolean(process.env.THRAD_API_KEY?.trim());

  return {
    thrad: hasThrad ? "live" : "stub",
    tavily: hasTavily ? "live" : "stub",
    claimGrounding: hasTavily ? "hybrid" : "stub",
    overmind: "export-ready",
    cursor: "built-with",
  };
}
