import { supplyInventoryLabel } from "./supplyMode";
import { StubAdProvider } from "./StubAdProvider";
import { ThradProvider } from "./ThradProvider";
import type { AdProvider } from "./AdProvider";

export { supplyInventoryLabel, useRandomSupply } from "./supplyMode";

/**
 * Hackathon demo uses stub supply only. Thrad is wired for go-to-market after
 * the app ships — set ENABLE_THRAD_GTM=1 + THRAD_API_KEY when you plug in live supply.
 */
export function getSupplyProviderLabel(): "stub" | "thrad" {
  const gtmEnabled = process.env.ENABLE_THRAD_GTM === "1";
  return gtmEnabled && process.env.THRAD_API_KEY?.trim() ? "thrad" : "stub";
}

export function getAdProvider(): AdProvider {
  if (getSupplyProviderLabel() === "thrad") {
    return new ThradProvider();
  }
  return new StubAdProvider();
}
