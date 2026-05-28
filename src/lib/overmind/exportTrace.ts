import type { PipelineResult } from "@/lib/types";

export interface OvermindExportBundle {
  version: "glassbox-trace-v1";
  exportedAt: string;
  impressionId: string;
  prompt: string;
  policyRef: "overmind/policies.md";
  datasetRef: "overmind/dataset.json";
  placementDecision: string;
  runMeta: PipelineResult["runMeta"];
  integrations: PipelineResult["integrations"];
  winnerAdvertiser?: string;
  blockedAdvertisers: string[];
  trace: PipelineResult["trace"];
  policyIds: string[];
}

export function buildOvermindExport(result: PipelineResult): OvermindExportBundle {
  const policyIds = [
    result.promptSafety.policyId,
    ...result.trace
      .map((t) => t.policyId)
      .filter((id): id is string => Boolean(id)),
  ];

  return {
    version: "glassbox-trace-v1",
    exportedAt: new Date().toISOString(),
    impressionId: result.impressionId,
    prompt: result.prompt,
    policyRef: "overmind/policies.md",
    datasetRef: "overmind/dataset.json",
    placementDecision: result.receipt.placementDecision,
    runMeta: result.runMeta,
    integrations: result.integrations,
    winnerAdvertiser: result.receipt.winnerAdvertiser,
    blockedAdvertisers: result.candidates
      .filter((c) => c.status === "blocked")
      .map((c) => c.advertiser),
    trace: result.trace,
    policyIds: [...new Set(policyIds)],
  };
}

export function downloadTraceJson(result: PipelineResult): void {
  const bundle = buildOvermindExport(result);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `glassbox-trace-${result.impressionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
