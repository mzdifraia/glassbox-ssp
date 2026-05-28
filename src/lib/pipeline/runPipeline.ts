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
import { createImpressionId, createPhaseTimer } from "@/lib/utils/latency";
import {
  appendSkippedSteps,
  claimGroundingReason,
  makeStep,
} from "./buildSteps";
import { buildSponsored } from "./buildSponsored";
import { PIPELINE_STEP_IDS, PIPELINE_STEP_NAMES } from "./constants";
import { processCandidates } from "./processCandidates";

export async function runPipeline(
  prompt: string,
  options: RunPipelineOptions = {}
): Promise<PipelineResult> {
  const startedAt = Date.now();
  const phase = createPhaseTimer();
  const impressionId = createImpressionId();
  const integrations = getIntegrationStatus();
  const traceId = process.env.OVERMIND_TRACE_ID;
  const simulateApiFailure =
    options.simulateApiFailure ||
    process.env.SIMULATE_THRAD_FAILURE === "1";

  const promptSafety = checkPromptSafety(prompt);
  const promptSafetyMs = phase.lap();
  const intent = classifyIntent(prompt, promptSafety.category);
  const intentMs = phase.lap();

  const steps: PipelineStep[] = [];
  const attributionEvents: AttributionEvent[] = [];
  const now = () => new Date().toISOString();

  const traceTimings: TraceTimings = { promptSafetyMs, intentMs };

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[0],
      PIPELINE_STEP_NAMES[0],
      promptSafety.monetisable ? "passed" : "blocked",
      promptSafety.confidence,
      promptSafety.reason,
      promptSafetyMs
    ),
    makeStep(
      PIPELINE_STEP_IDS[1],
      PIPELINE_STEP_NAMES[1],
      "passed",
      intent.confidence,
      intent.reason,
      intentMs
    )
  );

  if (!promptSafety.monetisable) {
    appendSkippedSteps(steps, 2, "Skipped — auction suppressed");
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
    traceTimings.attributionMs = phase.lap();

    return finalize({
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
    });
  }

  let candidates: AdCandidate[] = [];
  let apiFailure = false;
  let candidatesMs = 0;

  if (simulateApiFailure) {
    apiFailure = true;
    candidatesMs = phase.lap();
    steps.push(
      makeStep(
        PIPELINE_STEP_IDS[2],
        PIPELINE_STEP_NAMES[2],
        "failed",
        0,
        "Ad provider API failure — serving normal answer without ads",
        candidatesMs
      )
    );
  } else {
    try {
      candidates = await getAdProvider().getCandidates({
        prompt,
        intent: intent.intent,
      });
      candidatesMs = phase.lap();
      steps.push(
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "passed",
          0.88,
          `Retrieved ${candidates.length} candidates`,
          candidatesMs
        )
      );
    } catch (err) {
      apiFailure = true;
      candidatesMs = phase.lap();
      steps.push(
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "failed",
          0,
          err instanceof AdProviderError
            ? err.message
            : "Ad provider unavailable",
          candidatesMs
        )
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

    return finalize({
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
    });
  }

  let scored: AdCandidate[];
  let winner: AdCandidate | null;
  let blockedCount: number;
  let claimGroundingMs = 0;
  let candidateSafetyMs = 0;
  let scoringMs = 0;

  if (options.forceNoSafeAds) {
    scored = candidates.map((c) => ({
      ...c,
      status: "blocked" as const,
      reason: "Forced NO_SAFE_ADS demo mode",
    }));
    winner = null;
    blockedCount = scored.length;
    const blockMs = phase.lap();
    claimGroundingMs = blockMs;
    candidateSafetyMs = 0;
    scoringMs = 0;
  } else {
    const processed = await processCandidates(candidates, {
      intent: intent.intent,
      promptCategory: promptSafety.category,
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[3],
      PIPELINE_STEP_NAMES[3],
      "passed",
      0.87,
      claimGroundingReason(integrations),
      claimGroundingMs
    ),
    makeStep(
      PIPELINE_STEP_IDS[4],
      PIPELINE_STEP_NAMES[4],
      "passed",
      0.9,
      `${blockedCount} blocked, ${scored.length - blockedCount} survivors`,
      candidateSafetyMs
    ),
    makeStep(
      PIPELINE_STEP_IDS[5],
      PIPELINE_STEP_NAMES[5],
      winner ? "passed" : "blocked",
      winner ? 0.92 : 0.5,
      winner ? `Winner: ${winner.advertiser}` : "No eligible winner",
      scoringMs
    )
  );

  // Drain gap between fetch and processCandidates (timed above) from later steps
  phase.lap();

  const sponsored = buildSponsored(winner, intent);
  const sponsoredMs = phase.lap();
  const noSafeAds = !winner;

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[6],
      PIPELINE_STEP_NAMES[6],
      winner ? "passed" : "blocked",
      winner ? 0.95 : 0.5,
      winner ? "Sponsored placement rendered" : "No sponsored placement",
      sponsoredMs
    )
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[7],
      PIPELINE_STEP_NAMES[7],
      "passed",
      0.98,
      `Placement: ${receipt.placementDecision}`,
      traceTimings.receiptMs
    )
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[8],
      PIPELINE_STEP_NAMES[8],
      "passed",
      1,
      `${attributionEvents.length} event(s) logged`,
      traceTimings.attributionMs
    )
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[9],
      PIPELINE_STEP_NAMES[9],
      "passed",
      1,
      `${trace.length} trace rows emitted`,
      traceBuildMs
    )
  );

  return finalize({
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
    }),
    receipt,
    attributionEvents,
    trace,
    intent,
    promptSafety,
  });
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
  base: Omit<PipelineResult, "durationMs"> & { startedAt: number }
): PipelineResult {
  const { startedAt, ...rest } = base;
  return { ...rest, durationMs: Date.now() - startedAt };
}
