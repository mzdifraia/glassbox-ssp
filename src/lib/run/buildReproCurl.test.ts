import { describe, expect, it } from "vitest";
import { buildReproCurl } from "./buildReproCurl";

describe("buildReproCurl", () => {
  it("includes seed when provided", () => {
    const curl = buildReproCurl("hello", { seed: "golden-safe" });
    expect(curl).toContain("golden-safe");
    expect(curl).toContain("hello");
  });
});
