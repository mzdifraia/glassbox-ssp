import { getSupplyProviderLabel } from "@/lib/ads/provider";
import {
  supplyModeFromVariance,
  type RunVariance,
} from "@/lib/supply/runVariance";
import type { RunMeta } from "@/lib/types";

export function buildRunMeta(variance: RunVariance): RunMeta {
  return {
    supplyProvider: getSupplyProviderLabel(),
    auctionMode: supplyModeFromVariance(variance),
    auctionSeed: variance.seedLabel,
  };
}
