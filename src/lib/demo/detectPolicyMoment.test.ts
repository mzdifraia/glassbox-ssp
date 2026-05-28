import { describe, expect, it } from "vitest";
import { SAFE_COMMERCIAL_PROMPT } from "@/data/demoPrompts";
import { runPipeline } from "@/lib/pipeline/runPipeline";
import { detectPolicyMoment } from "./detectPolicyMoment";

describe("detectPolicyMoment", () => {
  it("flags HyperBooks outbid block on safe path", async () => {
    const result = await runPipeline(SAFE_COMMERCIAL_PROMPT, {
      seed: "golden-safe",
    });
    const moment = detectPolicyMoment(result);
    expect(moment?.id).toMatch(/hyperbooks/);
    expect(moment?.tone).toBe("policy-win");
  });
});
