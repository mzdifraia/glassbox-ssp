import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAFE_COMMERCIAL_PROMPT,
  VULNERABLE_PROMPT,
} from "@/data/demoPrompts";
import { runPipeline } from "./runPipeline";

describe("runPipeline variance", () => {
  beforeEach(() => {
    vi.stubEnv("TAVILY_API_KEY", "");
    vi.stubEnv("THRAD_API_KEY", "");
    vi.stubEnv("DETERMINISTIC_DEMO", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("repeats the same winner for the same seed", async () => {
    const a = await runPipeline(SAFE_COMMERCIAL_PROMPT, { seed: "golden-safe" });
    const b = await runPipeline(SAFE_COMMERCIAL_PROMPT, { seed: "golden-safe" });
    expect(a.sponsored.served).toBe(true);
    expect(a.sponsored.advertiser).toBe(b.sponsored.advertiser);
    expect(a.integrations.supply).toBe("seeded");
    expect(a.runMeta.auctionSeed).toBe("golden-safe");
    expect(a.runMeta.supplyProvider).toBe("stub");
  });

  it("differs across seeds often enough to feel live", async () => {
    const winners = new Set<string>();
    for (const seed of [
      "auction-a",
      "auction-b",
      "auction-c",
      "auction-d",
      "auction-e",
      "auction-f",
    ]) {
      const r = await runPipeline(SAFE_COMMERCIAL_PROMPT, { seed });
      if (r.sponsored.advertiser) winners.add(r.sponsored.advertiser);
    }
    expect(winners.size).toBeGreaterThan(1);
  });

  it("live mode (no seed) uses live-auction supply", async () => {
    const r = await runPipeline(SAFE_COMMERCIAL_PROMPT);
    expect(r.integrations.supply).toBe("live-auction");
  });

  it("always suppresses vulnerable prompts regardless of seed", async () => {
    for (const seed of [undefined, "any-seed", "golden-safe"]) {
      const r = await runPipeline(VULNERABLE_PROMPT, seed ? { seed } : {});
      expect(r.auctionSuppressed).toBe(true);
      expect(r.sponsored.served).toBe(false);
    }
  });

  it("always blocks HyperBooks on supported safe path", async () => {
    const r = await runPipeline(SAFE_COMMERCIAL_PROMPT, { seed: "hyperbooks-check" });
    const hyper = r.candidates.find((c) => c.id === "hyperbooks");
    expect(hyper?.status).toBe("blocked");
  });

  it("frozen mode pins supply metrics", async () => {
    const a = await runPipeline(SAFE_COMMERCIAL_PROMPT, { frozen: true });
    const b = await runPipeline(SAFE_COMMERCIAL_PROMPT, { frozen: true });
    expect(a.integrations.supply).toBe("fixed");
    expect(a.candidates.find((c) => c.id === "ledgerly")?.bidCents).toBe(
      b.candidates.find((c) => c.id === "ledgerly")?.bidCents
    );
    expect(a.sponsored.advertiser).toBe(b.sponsored.advertiser);
  });
});
