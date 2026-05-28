import { PIPELINE_STEP_IDS } from "@/lib/pipeline/constants";
import {
  SAFE_COMMERCIAL_PROMPT,
  VULNERABLE_PROMPT,
} from "@/data/demoPrompts";
export type DemoKind = "safe" | "vulnerable";

export type DemoScenarioId = "idle" | "commercial" | "distress" | "custom";

export type DemoRunPhase =
  | "idle"
  | "between"
  | "pipeline"
  | "typing"
  | "settled";

export interface DemoRunStatusView {
  scenario: DemoScenarioId;
  scenarioShort: string;
  scenarioTitle: string;
  phase: DemoRunPhase;
  phaseLabel: string;
  stepIndex: number;
  stepTotal: number;
  stepId: string | null;
  stepName: string | null;
  stepDetail: string | null;
  watching: string;
  beatPause: string | null;
}

const STEP_TOTAL = PIPELINE_STEP_IDS.length;

export function scenarioFromRun(
  prompt: string | null,
  kind?: DemoKind
): DemoScenarioId {
  if (!prompt) return "idle";
  if (kind === "safe" || prompt === SAFE_COMMERCIAL_PROMPT) return "commercial";
  if (kind === "vulnerable" || prompt === VULNERABLE_PROMPT) return "distress";
  return "custom";
}

export function scenarioMeta(id: DemoScenarioId): {
  short: string;
  title: string;
} {
  switch (id) {
    case "commercial":
      return { short: "A", title: "Commercial prompt" };
    case "distress":
      return { short: "B", title: "Distress prompt" };
    case "custom":
      return { short: "·", title: "Custom prompt" };
    default:
      return { short: "—", title: "None selected" };
  }
}

export function buildDemoRunStatus(input: {
  activeScenario: DemoScenarioId;
  phase: DemoRunPhase;
  stepId: string | null;
  stepName: string | null;
  stepDetail: string | null;
  beatPause: string | null;
  auctionSuppressed?: boolean;
}): DemoRunStatusView {
  const meta = scenarioMeta(input.activeScenario);
  const stepIndex =
    input.stepId != null
      ? Math.max(0, PIPELINE_STEP_IDS.indexOf(input.stepId as (typeof PIPELINE_STEP_IDS)[number])) + 1
      : 0;

  let phaseLabel = "Waiting";
  let watching = "Scenario buttons above";

  switch (input.phase) {
    case "between":
      phaseLabel = "Paused between scenarios";
      watching = "Compare summary (A finished)";
      break;
    case "pipeline":
      phaseLabel = "POST /api/run/stream";
      watching =
        input.stepId === "candidates" || input.stepName?.includes("Candidate")
          ? "Candidate auction (loading)"
          : "Decision pipeline";
      break;
    case "typing":
      phaseLabel = "Rendering assistant message";
      watching = "Chat thread";
      break;
    case "settled":
      phaseLabel = "Run finished — panels below are from this run";
      watching = input.auctionSuppressed
        ? "Transparency receipt (suppressed)"
        : "Auction + receipt + trace";
      break;
    default:
      phaseLabel = "Idle";
      watching = "System overview · pick scenario A or B";
      break;
  }

  return {
    scenario: input.activeScenario,
    scenarioShort: meta.short,
    scenarioTitle: meta.title,
    phase: input.phase,
    phaseLabel,
    stepIndex,
    stepTotal: STEP_TOTAL,
    stepId: input.stepId,
    stepName: input.stepName,
    stepDetail: input.stepDetail,
    watching,
    beatPause: input.beatPause,
  };
}
