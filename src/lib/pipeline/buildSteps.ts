import type { IntegrationStatus, PipelineStep } from "@/lib/types";
import { PIPELINE_STEP_IDS, PIPELINE_STEP_NAMES } from "./constants";

export function makeStep(
  id: string,
  name: string,
  status: PipelineStep["status"],
  confidence: number,
  reason: string,
  latencyMs: number
): PipelineStep {
  return { id, name, status, confidence, reason, latencyMs };
}

export function appendSkippedSteps(
  steps: PipelineStep[],
  fromIndex: number,
  reason: string
): void {
  for (let i = fromIndex; i < PIPELINE_STEP_NAMES.length; i++) {
    const isTail = i >= 7;
    steps.push(
      makeStep(
        PIPELINE_STEP_IDS[i] ?? `step-${i}`,
        PIPELINE_STEP_NAMES[i],
        isTail ? "passed" : "skipped",
        isTail ? 1 : 0,
        isTail ? "Completed" : reason,
        0
      )
    );
  }
}

export function claimGroundingReason(integrations: IntegrationStatus): string {
  if (integrations.claimGrounding === "hybrid") {
    return "Hybrid: policy hard-block + Tavily grounding (parallel)";
  }
  if (integrations.tavily === "live") {
    return "Tavily claim grounding (parallel)";
  }
  return "Stub claim grounding";
}
