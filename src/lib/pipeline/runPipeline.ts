import { buildAssistantMessage } from "@/lib/assistant/buildAssistantMessage";
import { getAdProvider } from "@/lib/ads/provider";
import { AdProviderError } from "@/lib/ads/AdProvider";
import { classifyIntent } from "@/lib/intent/classifyIntent";
import { getIntegrationStatus } from "@/lib/integrations/status";
import { buildReceipt } from "@/lib/receipt/buildReceipt";
import { checkPromptSafety } from "@/lib/safety/promptSafety";
import { buildTrace, type TraceTimings } from "@/lib/trace/buildTrace";
import type {
  AdCandidate,
  AttributionEvent,
  PipelineResult,
  PipelineStep,
  RunPipelineOptions,
  SponsoredContent,
} from "@/lib/types";
import { buildRunMeta } from "@/lib/run/buildRunMeta";
import { getSupplyProviderLabel } from "@/lib/ads/provider";
import {
  applySupplyVariance,
  createRunVariance,
  jitterConfidence,
  supplyModeFromVariance,
  varianceIsActive,
} from "@/lib/supply/runVariance";
import { createImpressionId, createPhaseTimer } from "@/lib/utils/latency";
import {
  appendSkippedSteps,
  claimGroundingReason,
  makeStep,
  pushStep,
} from "./buildSteps";
import { buildSponsored } from "./buildSponsored";
import { PIPELINE_STEP_IDS, PIPELINE_STEP_NAMES } from "./constants";
import { processCandidates } from "./processCandidates";
import type { PipelineProgressHandler } from "./streamEvents";

async function status(
  onProgress: PipelineProgressHandler | undefined,
  message: string
) {
  if (onProgress) await onProgress({ type: "status", message });
}

export async function runPipeline(
  prompt: string,
  options: RunPipelineOptions = {}
): Promise<PipelineResult> {
  const onProgress = options.onProgress;
  const variance = createRunVariance({
    frozen: options.frozen ?? options.deterministic,
    seed: options.seed,
  });
  const startedAt = Date.now();
  const phase = createPhaseTimer();
  const impressionId = createImpressionId();
  const integrations = {
    ...getIntegrationStatus(),
    supply: supplyModeFromVariance(variance),
  };
  const traceId = process.env.OVERMIND_TRACE_ID;
  const simulateApiFailure =
    options.simulateApiFailure ||
    process.env.SIMULATE_THRAD_FAILURE === "1";

  await status(onProgress, "Evaluating prompt against publisher policy…");

  let promptSafety = checkPromptSafety(prompt);
  if (varianceIsActive(variance) && promptSafety.monetisable) {
    promptSafety = {
      ...promptSafety,
      confidence: jitterConfidence(promptSafety.confidence, variance),
    };
  }
  const promptSafetyMs = phase.lap();
  const intent = classifyIntent(prompt, promptSafety.category, variance);
  const intentMs = phase.lap();

  const steps: PipelineStep[] = [];
  const attributionEvents: AttributionEvent[] = [];
  const now = () => new Date().toISOString();
  const traceTimings: TraceTimings = { promptSafetyMs, intentMs };

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[0],
      PIPELINE_STEP_NAMES[0],
      promptSafety.monetisable ? "passed" : "blocked",
      promptSafety.confidence,
      promptSafety.reason,
      promptSafetyMs
    ),
    onProgress
  );
  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[1],
      PIPELINE_STEP_NAMES[1],
      "passed",
      intent.confidence,
      intent.reason,
      intentMs
    ),
    onProgress
  );

  if (!promptSafety.monetisable) {
    await status(onProgress, "Vulnerable context — suppressing auction…");
    appendSkippedSteps(steps, 2, "Skipped — auction suppressed");
    for (const step of steps.slice(2)) {
      await onProgress?.({ type: "step", step });
    }

    attributionEvents.push({
      id: `evt_${Date.now()}`,
      type: "suppression_logged",
      timestamp: now(),
      impressionId,
      detail: promptSafety.reason,
    });

    const receipt = buildReceipt({
      promptSafety,
      intent: intent.intent,
      monetisable: false,
      adRequestMade: false,
      winner: null,
      candidates: [],
      auctionSuppressed: true,
      noSafeAds: false,
    });
    traceTimings.receiptMs = phase.lap();

    const result = finalize({
      prompt,
      impressionId,
      traceId,
      integrations,
      startedAt,
      monetisable: false,
      auctionSuppressed: true,
      apiFailure: false,
      noSafeAds: false,
      steps,
      candidates: [],
      candidateMessage: "Auction suppressed — no ad request",
      sponsored: suppressionSponsored(),
      assistantMessage: buildAssistantMessage(prompt, {
        hasSponsored: false,
        apiFailure: false,
        intent,
        promptSafety,
      }),
      receipt,
      attributionEvents,
      trace: buildTrace(
        {
          prompt,
          intent: intent.intent,
          monetisable: false,
          candidateCount: 0,
          blockedCount: 0,
          suppressed: true,
          apiFailure: false,
        },
        traceTimings
      ),
      intent,
      promptSafety,
      variance,
    });

    await onProgress?.({ type: "candidates", candidates: [], message: result.candidateMessage });
    await onProgress?.({ type: "complete", result });
    return result;
  }

  let candidates: AdCandidate[] = [];
  let apiFailure = false;
  let candidatesMs = 0;

  await status(onProgress, "Requesting candidates from supply adapter…");

  if (simulateApiFailure) {
    apiFailure = true;
    candidatesMs = phase.lap();
    await pushStep(
      steps,
      makeStep(
        PIPELINE_STEP_IDS[2],
        PIPELINE_STEP_NAMES[2],
        "failed",
        0,
        "Ad provider API failure — serving normal answer without ads",
        candidatesMs
      ),
      onProgress
    );
  } else {
    try {
      candidates = applySupplyVariance(
        await getAdProvider().getCandidates({
          prompt,
          intent: intent.intent,
        }),
        variance
      );
      candidatesMs = phase.lap();
      await pushStep(
        steps,
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "passed",
          0.88,
          `Retrieved ${candidates.length} candidates (${getSupplyProviderLabel()} supply)`,
          candidatesMs
        ),
        onProgress
      );
    } catch (err) {
      apiFailure = true;
      candidatesMs = phase.lap();
      await pushStep(
        steps,
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "failed",
          0,
          err instanceof AdProviderError
            ? err.message
            : "Ad provider unavailable",
          candidatesMs
        ),
        onProgress
      );
    }
  }

  traceTimings.candidatesMs = candidatesMs;

  if (apiFailure) {
    appendSkippedSteps(steps, 3, "Skipped due to API failure");
    const receipt = buildReceipt({
      promptSafety,
      intent: intent.intent,
      monetisable: true,
      adRequestMade: true,
      winner: null,
      candidates: [],
      auctionSuppressed: false,
      noSafeAds: true,
    });
    traceTimings.receiptMs = phase.lap();

    const result = finalize({
      prompt,
      impressionId,
      traceId,
      integrations,
      startedAt,
      monetisable: true,
      auctionSuppressed: false,
      apiFailure: true,
      noSafeAds: true,
      steps,
      candidates: [],
      sponsored: {
        served: false,
        label: "No sponsored content served",
        headline: "",
        body: "",
        explanation: "Ad provider unavailable — unbiased response only",
      },
      assistantMessage: buildAssistantMessage(prompt, {
        hasSponsored: false,
        apiFailure: true,
        intent,
        promptSafety,
      }),
      receipt,
      attributionEvents,
      trace: buildTrace(
        {
          prompt,
          intent: intent.intent,
          monetisable: true,
          candidateCount: 0,
          blockedCount: 0,
          suppressed: false,
          apiFailure: true,
        },
        traceTimings
      ),
      intent,
      promptSafety,
      variance,
    });
    await onProgress?.({ type: "complete", result });
    return result;
  }

  let scored: AdCandidate[];
  let winner: AdCandidate | null;
  let blockedCount: number;
  let claimGroundingMs = 0;
  let candidateSafetyMs = 0;
  let scoringMs = 0;

  await status(
    onProgress,
    integrations.tavily === "live"
      ? "Grounding claims (Tavily) and running safety gates…"
      : "Running claim checks and safety gates…"
  );

  if (options.forceNoSafeAds) {
    scored = candidates.map((c) => ({
      ...c,
      status: "blocked" as const,
      reason: "Forced NO_SAFE_ADS demo mode",
    }));
    winner = null;
    blockedCount = scored.length;
    phase.lap();
  } else {
    const processed = await processCandidates(candidates, {
      intent: intent.intent,
      promptCategory: promptSafety.category,
      variance,
    });
    scored = processed.scored;
    winner = processed.winner;
    blockedCount = processed.blockedCount;
    claimGroundingMs = processed.claimGroundingMs;
    candidateSafetyMs = processed.candidateSafetyMs;
    scoringMs = processed.scoringMs;
  }

  traceTimings.claimGroundingMs = claimGroundingMs;
  traceTimings.candidateSafetyMs = candidateSafetyMs;
  traceTimings.scoringMs = scoringMs;

  await onProgress?.({ type: "candidates", candidates: scored });

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[3],
      PIPELINE_STEP_NAMES[3],
      "passed",
      0.87,
      claimGroundingReason(integrations),
      claimGroundingMs
    ),
    onProgress
  );
  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[4],
      PIPELINE_STEP_NAMES[4],
      "passed",
      0.9,
      `${blockedCount} blocked, ${scored.length - blockedCount} survivors`,
      candidateSafetyMs
    ),
    onProgress
  );
  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[5],
      PIPELINE_STEP_NAMES[5],
      winner ? "passed" : "blocked",
      winner ? 0.92 : 0.5,
      winner ? `Winner: ${winner.advertiser}` : "No eligible winner",
      scoringMs
    ),
    onProgress
  );

  phase.lap();

  await status(onProgress, "Rendering sponsored placement and transparency receipt…");

  const sponsored = buildSponsored(winner, intent);
  const sponsoredMs = phase.lap();
  const noSafeAds = !winner;

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[6],
      PIPELINE_STEP_NAMES[6],
      winner ? "passed" : "blocked",
      winner ? 0.95 : 0.5,
      winner ? "Sponsored placement rendered" : "No sponsored placement",
      sponsoredMs
    ),
    onProgress
  );

  const receipt = buildReceipt({
    promptSafety,
    intent: intent.intent,
    monetisable: true,
    adRequestMade: true,
    winner,
    candidates: scored,
    auctionSuppressed: false,
    noSafeAds,
  });
  traceTimings.receiptMs = phase.lap();

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[7],
      PIPELINE_STEP_NAMES[7],
      "passed",
      0.98,
      `Placement: ${receipt.placementDecision}`,
      traceTimings.receiptMs
    ),
    onProgress
  );

  if (winner) {
    attributionEvents.push({
      id: `evt_${Date.now()}_imp`,
      type: "impression_created",
      timestamp: now(),
      impressionId,
      detail: `Winner: ${winner.advertiser}`,
    });
  }

  traceTimings.attributionMs = phase.lap();

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[8],
      PIPELINE_STEP_NAMES[8],
      "passed",
      1,
      `${attributionEvents.length} event(s) logged`,
      traceTimings.attributionMs
    ),
    onProgress
  );

  const trace = buildTrace(
    {
      prompt,
      intent: intent.intent,
      monetisable: true,
      candidateCount: candidates.length,
      blockedCount,
      winnerId: winner?.id,
      suppressed: false,
      apiFailure: false,
    },
    traceTimings
  );

  const traceBuildMs = phase.lap();

  await pushStep(
    steps,
    makeStep(
      PIPELINE_STEP_IDS[9],
      PIPELINE_STEP_NAMES[9],
      "passed",
      1,
      `${trace.length} trace rows emitted`,
      traceBuildMs
    ),
    onProgress
  );

  const result = finalize({
    prompt,
    impressionId,
    traceId,
    integrations,
    startedAt,
    monetisable: true,
    auctionSuppressed: false,
    apiFailure: false,
    noSafeAds,
    steps,
    candidates: scored,
    sponsored,
    assistantMessage: buildAssistantMessage(prompt, {
      hasSponsored: !!winner,
      apiFailure: false,
      intent,
      promptSafety,
      winnerName: winner?.advertiser,
      variance,
    }),
    receipt,
    attributionEvents,
    trace,
    intent,
    promptSafety,
    variance,
  });

  await onProgress?.({ type: "complete", result });
  return result;
}

function suppressionSponsored(): SponsoredContent {
  return {
    served: false,
    label: "No sponsored content served",
    headline: "",
    body: "",
    explanation:
      "This is high commercial intent, but it is also vulnerability. The adtech incentive is to serve a debt product. GlassBox suppresses it.",
  };
}

function finalize(
  base: Omit<PipelineResult, "durationMs" | "runMeta"> & {
    startedAt: number;
    variance: import("@/lib/supply/runVariance").RunVariance;
  }
): PipelineResult {
  const { startedAt, variance, ...rest } = base;
  return {
    ...rest,
    runMeta: buildRunMeta(variance),
    durationMs: Date.now() - startedAt,
  };
}
