import type { AdCandidate, PipelineResult, PipelineStep } from "@/lib/types";

export type PipelineStreamEvent =
  | { type: "status"; message: string }
  | { type: "step"; step: PipelineStep }
  | { type: "candidates"; candidates: AdCandidate[]; message?: string }
  | { type: "complete"; result: PipelineResult }
  | { type: "error"; message: string };

export type PipelineProgressHandler = (
  event: PipelineStreamEvent
) => void | Promise<void>;
