import { describe, expect, it } from "vitest";
import { generateRandomCandidates } from "./generateRandomCandidates";

describe("generateRandomCandidates", () => {
  it("returns multiple candidates for accounting intent", () => {
    const list = generateRandomCandidates({
      prompt: "accounting software",
      intent: "b2b.finance.accounting",
    });
    expect(list.length).toBeGreaterThanOrEqual(4);
    const trap = list.find((c) =>
      c.claims.some((cl) => /guaranteed/i.test(cl))
    );
    expect(trap).toBeDefined();
    expect(trap!.bidCents).toBeGreaterThan(500);
  });

  it("differs across calls", () => {
    const a = generateRandomCandidates({
      prompt: "x",
      intent: "b2b.finance.accounting",
    });
    const b = generateRandomCandidates({
      prompt: "x",
      intent: "b2b.finance.accounting",
    });
    const sameIds = a.every((c, i) => c.advertiser === b[i]?.advertiser);
    expect(sameIds).toBe(false);
  });
});
