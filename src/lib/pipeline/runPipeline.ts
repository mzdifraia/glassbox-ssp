import { getAdProvider } from "@/lib/ads/provider";
import { AdProviderError } from "@/lib/ads/AdProvider";
import { groundClaimsWithTavily } from "@/lib/claims/groundClaims";
import { classifyIntent } from "@/lib/intent/classifyIntent";
import { buildReceipt } from "@/lib/receipt/buildReceipt";
import { scoreSurvivors } from "@/lib/scoring/scoreCandidates";
import { checkCandidateSafety } from "@/lib/safety/candidateSafety";
import { checkPromptSafety } from "@/lib/safety/promptSafety";
import { buildTrace } from "@/lib/trace/buildTrace";
import type {
  AttributionEvent,
  PipelineResult,
  PipelineStep,
  RunPipelineOptions,
  SponsoredContent,
} from "@/lib/types";
import { getIntegrationStatus } from "@/lib/integrations/status";
import { createImpressionId, mockLatency } from "@/lib/utils/latency";

const PIPELINE_STEP_NAMES = [
  "Prompt safety gate",
  "Intent classifier",
  "Candidate retrieval",
  "Candidate safety gate",
  "Claim grounding",
  "Scoring",
  "Sponsored response",
  "Receipt",
  "Attribution",
  "Trace",
] as const;

function makeStep(
  id: string,
  name: string,
  status: PipelineStep["status"],
  confidence: number,
  reason: string
): PipelineStep {
  return {
    id,
    name,
    status,
    confidence,
    reason,
    latencyMs: mockLatency(),
  };
}

function buildAssistantContent(
  prompt: string,
  hasSponsored: boolean,
  apiFailure: boolean
): string {
  if (apiFailure) {
    return `I can help you evaluate options for: "${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}". Sponsored placements are temporarily unavailable — here's an unbiased answer based on your question.`;
  }
  if (hasSponsored) {
    return `For a 12-person startup evaluating accounting tools, focus on multi-user access, bank feeds, and scalable reporting. I've included a clearly labeled sponsored suggestion below that passed our safety and transparency checks.`;
  }
  return `I understand you're dealing with a difficult financial situation. I'm not able to show sponsored financial products in this context. Here are some general resources: consider speaking with a nonprofit credit counselor (NFCC), reviewing your budget with a trusted advisor, and checking government consumer finance guidance.`;
}

export async function runPipeline(
  prompt: string,
  options: RunPipelineOptions = {}
): Promise<PipelineResult> {
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
      "prompt-safety",
      PIPELINE_STEP_NAMES[0],
      promptSafety.monetisable ? "passed" : "blocked",
      promptSafety.confidence,
      promptSafety.reason
    )
  );

  steps.push(
    makeStep(
      "intent",
      PIPELINE_STEP_NAMES[1],
      "passed",
      intent.confidence,
      intent.reason
    )
  );

  if (!promptSafety.monetisable) {
    const skippedStatuses: PipelineStep["status"][] = [
      "skipped",
      "skipped",
      "skipped",
      "skipped",
      "skipped",
      "skipped",
      "passed",
      "passed",
    ];
    for (let i = 2; i < PIPELINE_STEP_NAMES.length; i++) {
      const status =
        i < 7 ? skippedStatuses[i - 2] ?? "skipped" : ("passed" as const);
      steps.push(
        makeStep(
          `step-${i}`,
          PIPELINE_STEP_NAMES[i],
          status,
          status === "passed" ? 1 : 0,
          i < 7 ? "Skipped — auction suppressed" : "Completed"
        )
      );
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

    const sponsored: SponsoredContent = {
      served: false,
      label: "No sponsored content served",
      headline: "",
      body: "",
      explanation:
        "This is high commercial intent, but it is also vulnerability. The adtech incentive is to serve a debt product. GlassBox suppresses it.",
    };

    const trace = buildTrace({
      prompt,
      intent: intent.intent,
      monetisable: false,
      candidateCount: 0,
      blockedCount: 0,
      suppressed: true,
      apiFailure: false,
    });

    return {
      prompt,
      impressionId,
      traceId,
      monetisable: false,
      auctionSuppressed: true,
      apiFailure: false,
      noSafeAds: false,
      steps,
      candidates: [],
      candidateMessage: "Auction suppressed — no ad request",
      sponsored,
      assistantMessage: {
        role: "assistant",
        content: buildAssistantContent(prompt, false, false),
        hasSponsored: false,
      },
      receipt,
      attributionEvents,
      trace,
      intent,
      promptSafety,
      integrations,
    };
  }

  let candidates: import("@/lib/types").AdCandidate[] = [];
  let apiFailure = false;

  if (simulateApiFailure) {
    apiFailure = true;
    steps.push(
      makeStep(
        "candidates",
        PIPELINE_STEP_NAMES[2],
        "failed",
        0,
        "Ad provider API failure — serving normal answer without ads"
      )
    );
  } else {
    try {
      const provider = getAdProvider();
      candidates = await provider.getCandidates({
        prompt,
        intent: intent.intent,
      });
      steps.push(
        makeStep(
          "candidates",
          PIPELINE_STEP_NAMES[2],
          "passed",
          0.88,
          `Retrieved ${candidates.length} candidates`
        )
      );
    } catch (err) {
      apiFailure = true;
      const message =
        err instanceof AdProviderError
          ? err.message
          : "Ad provider unavailable";
      steps.push(
        makeStep(
          "candidates",
          PIPELINE_STEP_NAMES[2],
          "failed",
          0,
          message
        )
      );
    }
  }

  if (apiFailure) {
    for (let i = 3; i < PIPELINE_STEP_NAMES.length; i++) {
      steps.push(
        makeStep(
          `step-${i}`,
          PIPELINE_STEP_NAMES[i],
          i >= 7 ? "passed" : "skipped",
          0,
          "Skipped due to API failure"
        )
      );
    }

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

    return {
      prompt,
      impressionId,
      traceId,
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
      assistantMessage: {
        role: "assistant",
        content: buildAssistantContent(prompt, false, true),
        hasSponsored: false,
      },
      receipt,
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
      integrations,
    };
  }

  if (options.forceNoSafeAds) {
    candidates = candidates.map((c) => ({
      ...c,
      status: "blocked" as const,
      reason: "Forced NO_SAFE_ADS demo mode",
    }));
  }

  const processed: import("@/lib/types").AdCandidate[] = [];
  let blockedCount = 0;

  for (const candidate of candidates) {
    const claimCheck = await groundClaimsWithTavily(candidate);
    const safety = checkCandidateSafety(candidate, claimCheck, {
      intent: intent.intent,
      promptCategory: promptSafety.category,
    });

    if (!safety.safe) {
      blockedCount++;
      processed.push({
        ...candidate,
        status: "blocked",
        reason:
          safety.reason === "unsupported_claim"
            ? "Unsupported performance claim"
            : safety.detail,
      });
    } else {
      processed.push({ ...candidate, status: "eligible", reason: "" });
    }
  }

  steps.push(
    makeStep(
      "candidate-safety",
      PIPELINE_STEP_NAMES[3],
      blockedCount > 0 ? "passed" : "passed",
      0.9,
      `${blockedCount} blocked, ${processed.length - blockedCount} eligible`
    )
  );

  steps.push(
    makeStep(
      "claim-grounding",
      PIPELINE_STEP_NAMES[4],
      "passed",
      0.87,
      integrations.claimGrounding === "hybrid"
        ? "Hybrid: policy hard-block + Tavily grounding"
        : integrations.tavily === "live"
          ? "Tavily claim grounding"
          : "Stub claim grounding"
    )
  );

  const { scored: rawScored, winner } = scoreSurvivors(processed);
  const scored = winner
    ? rawScored.map((c) => {
        if (
          c.status === "blocked" &&
          c.bidCents > winner.bidCents &&
          c.reason.toLowerCase().includes("unsupported")
        ) {
          return {
            ...c,
            reason: `Bid $${(c.bidCents / 100).toFixed(2)} beats winner $${(winner.bidCents / 100).toFixed(2)} — blocked by policy, not score`,
          };
        }
        return c;
      })
    : rawScored;
  const noSafeAds = !winner;

  steps.push(
    makeStep(
      "scoring",
      PIPELINE_STEP_NAMES[5],
      winner ? "passed" : "blocked",
      winner ? 0.92 : 0.5,
      winner
        ? `Winner: ${winner.advertiser}`
        : "No eligible winner — all candidates blocked or lost"
    )
  );

  const sponsored: SponsoredContent = winner
    ? {
        served: true,
        label: "Sponsored suggestion",
        headline: winner.title,
        body: `${winner.body}\nShown because your prompt indicated B2B accounting software research for a small company.`,
        explanation: `Shown because your prompt indicated B2B accounting software research for a small company.`,
        advertiser: winner.advertiser,
        url: winner.url,
      }
    : {
        served: false,
        label: "No sponsored content served",
        headline: "",
        body: "",
        explanation: "No candidates passed all safety gates",
      };

  steps.push(
    makeStep(
      "sponsored",
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
      "receipt",
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
      "attribution",
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
      "trace",
      PIPELINE_STEP_NAMES[9],
      "passed",
      1,
      `${trace.length} trace rows emitted`
    )
  );

  return {
    prompt,
    impressionId,
    traceId,
    monetisable: true,
    auctionSuppressed: false,
    apiFailure: false,
    noSafeAds,
    steps,
    candidates: scored,
    sponsored,
    assistantMessage: {
      role: "assistant",
      content: buildAssistantContent(prompt, !!winner, false),
      hasSponsored: !!winner,
    },
    receipt,
    attributionEvents,
    trace,
    intent,
    promptSafety,
    integrations,
  };
}
