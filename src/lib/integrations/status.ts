import { supplyInventoryLabel } from "@/lib/ads/supplyMode";
import type { IntegrationStatus } from "@/lib/types";

export type { IntegrationStatus };

export function getIntegrationStatus(): IntegrationStatus {
  const hasTavily = Boolean(process.env.TAVILY_API_KEY?.trim());
  const thradLive =
    process.env.ENABLE_THRAD_GTM === "1" &&
    Boolean(process.env.THRAD_API_KEY?.trim());

  return {
    thrad: thradLive ? "live" : "gtm-ready",
    tavily: hasTavily ? "live" : "stub",
    claimGrounding: hasTavily ? "hybrid" : "stub",
    supply: process.env.DETERMINISTIC_DEMO === "1" ? "fixed" : "live-auction",
    inventory: supplyInventoryLabel(),
    overmind: "export-ready",
    cursor: "built-with",
  };
}
