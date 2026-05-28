import { buildAssistantMessage } from "@/lib/assistant/buildAssistantMessage";
import { getAdProvider } from "@/lib/ads/provider";
import { AdProviderError } from "@/lib/ads/AdProvider";
import { classifyIntent } from "@/lib/intent/classifyIntent";
import { getIntegrationStatus } from "@/lib/integrations/status";
import { buildReceipt } from "@/lib/receipt/buildReceipt";
import { checkPromptSafety } from "@/lib/safety/promptSafety";
import { buildTrace } from "@/lib/trace/buildTrace";
import type {
  AdCandidate,
  AttributionEvent,
  PipelineResult,
  PipelineStep,
  RunPipelineOptions,
  SponsoredContent,
} from "@/lib/types";
import { createImpressionId } from "@/lib/utils/latency";
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
  const impressionId = createImpressionId();
  const integrations = getIntegrationStatus();
  const traceId = process.env.OVERMIND_TRACE_ID;
  const simulateApiFailure =
    options.simulateApiFailure ||
    process.env.SIMULATE_THRAD_FAILURE === "1";

  const promptSafety = checkPromptSafety(prompt);
  const intent = classifyIntent(prompt, promptSafety.category);
  const steps: PipelineStep[] = [];
  const attributionEvents: AttributionEvent[] = [];
  const now = () => new Date().toISOString();

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[0],
      PIPELINE_STEP_NAMES[0],
      promptSafety.monetisable ? "passed" : "blocked",
      promptSafety.confidence,
      promptSafety.reason
    ),
    makeStep(
      PIPELINE_STEP_IDS[1],
      PIPELINE_STEP_NAMES[1],
      "passed",
      intent.confidence,
      intent.reason
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
      receipt: buildReceipt({
        promptSafety,
        intent: intent.intent,
        monetisable: false,
        adRequestMade: false,
        winner: null,
        candidates: [],
        auctionSuppressed: true,
        noSafeAds: false,
      }),
      attributionEvents,
      trace: buildTrace({
        prompt,
        intent: intent.intent,
        monetisable: false,
        candidateCount: 0,
        blockedCount: 0,
        suppressed: true,
        apiFailure: false,
      }),
      intent,
      promptSafety,
    });
  }

  let candidates: AdCandidate[] = [];
  let apiFailure = false;

  if (simulateApiFailure) {
    apiFailure = true;
    steps.push(
      makeStep(
        PIPELINE_STEP_IDS[2],
        PIPELINE_STEP_NAMES[2],
        "failed",
        0,
        "Ad provider API failure — serving normal answer without ads"
      )
    );
  } else {
    try {
      candidates = await getAdProvider().getCandidates({
        prompt,
        intent: intent.intent,
      });
      steps.push(
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "passed",
          0.88,
          `Retrieved ${candidates.length} candidates`
        )
      );
    } catch (err) {
      apiFailure = true;
      steps.push(
        makeStep(
          PIPELINE_STEP_IDS[2],
          PIPELINE_STEP_NAMES[2],
          "failed",
          0,
          err instanceof AdProviderError
            ? err.message
            : "Ad provider unavailable"
        )
      );
    }
  }

  if (apiFailure) {
    appendSkippedSteps(steps, 3, "Skipped due to API failure");
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
      receipt: buildReceipt({
        promptSafety,
        intent: intent.intent,
        monetisable: true,
        adRequestMade: true,
        winner: null,
        candidates: [],
        auctionSuppressed: false,
        noSafeAds: true,
      }),
      attributionEvents,
      trace: buildTrace({
        prompt,
        intent: intent.intent,
        monetisable: true,
        candidateCount: 0,
        blockedCount: 0,
        suppressed: false,
        apiFailure: true,
      }),
      intent,
      promptSafety,
    });
  }

  let scored: AdCandidate[];
  let winner: AdCandidate | null;
  let blockedCount: number;

  if (options.forceNoSafeAds) {
    scored = candidates.map((c) => ({
      ...c,
      status: "blocked" as const,
      reason: "Forced NO_SAFE_ADS demo mode",
    }));
    winner = null;
    blockedCount = scored.length;
  } else {
    const processed = await processCandidates(candidates, {
      intent: intent.intent,
      promptCategory: promptSafety.category,
    });
    scored = processed.scored;
    winner = processed.winner;
    blockedCount = processed.blockedCount;
  }

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[3],
      PIPELINE_STEP_NAMES[3],
      "passed",
      0.87,
      claimGroundingReason(integrations)
    ),
    makeStep(
      PIPELINE_STEP_IDS[4],
      PIPELINE_STEP_NAMES[4],
      "passed",
      0.9,
      `${blockedCount} blocked, ${scored.length - blockedCount} survivors`
    ),
    makeStep(
      PIPELINE_STEP_IDS[5],
      PIPELINE_STEP_NAMES[5],
      winner ? "passed" : "blocked",
      winner ? 0.92 : 0.5,
      winner
        ? `Winner: ${winner.advertiser}`
        : "No eligible winner"
    )
  );

  const sponsored = buildSponsored(winner, intent);
  const noSafeAds = !winner;

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[6],
      PIPELINE_STEP_NAMES[6],
      winner ? "passed" : "blocked",
      winner ? 0.95 : 0.5,
      winner ? "Sponsored placement rendered" : "No sponsored placement"
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[7],
      PIPELINE_STEP_NAMES[7],
      "passed",
      0.98,
      `Placement: ${receipt.placementDecision}`
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

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[8],
      PIPELINE_STEP_NAMES[8],
      "passed",
      1,
      `${attributionEvents.length} event(s) logged`
    )
  );

  const trace = buildTrace({
    prompt,
    intent: intent.intent,
    monetisable: true,
    candidateCount: candidates.length,
    blockedCount,
    winnerId: winner?.id,
    suppressed: false,
    apiFailure: false,
  });

  steps.push(
    makeStep(
      PIPELINE_STEP_IDS[9],
      PIPELINE_STEP_NAMES[9],
      "passed",
      1,
      `${trace.length} trace rows emitted`
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
