import { describe, expect, it } from "vitest";
import {
  applySupplyVariance,
  createRunVariance,
  createSeededRng,
  hashSeed,
} from "./runVariance";
import { getStubCandidates } from "@/data/stubCandidates";

describe("runVariance", () => {
  it("same seed produces identical jittered bids", () => {
    const base = getStubCandidates().slice(0, 3);
    const a = applySupplyVariance(base, createRunVariance({ seed: "fixture-42" }));
    const b = applySupplyVariance(base, createRunVariance({ seed: "fixture-42" }));
    expect(a.map((c) => c.bidCents)).toEqual(b.map((c) => c.bidCents));
    expect(a.map((c) => c.relevanceScore)).toEqual(b.map((c) => c.relevanceScore));
  });

  it("different seeds usually diverge", () => {
    const base = getStubCandidates().slice(0, 3);
    const a = applySupplyVariance(base, createRunVariance({ seed: "alpha" }));
    const b = applySupplyVariance(base, createRunVariance({ seed: "beta" }));
    const sameBids = a.every((c, i) => c.bidCents === b[i]!.bidCents);
    expect(sameBids).toBe(false);
  });

  it("frozen mode leaves supply untouched", () => {
    const base = getStubCandidates().slice(0, 2);
    const out = applySupplyVariance(base, createRunVariance({ frozen: true }));
    expect(out).toEqual(base);
  });

  it("seeded rng is stable for the same hash", () => {
    const a = createSeededRng(hashSeed("numeric-check"));
    const b = createSeededRng(hashSeed("numeric-check"));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
