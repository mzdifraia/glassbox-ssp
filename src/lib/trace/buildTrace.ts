import type { TraceRow } from "@/lib/types";

export interface TraceTimings {
  promptSafetyMs: number;
  intentMs: number;
  candidatesMs?: number;
  claimGroundingMs?: number;
  candidateSafetyMs?: number;
  scoringMs?: number;
  receiptMs?: number;
  attributionMs?: number;
}

interface TraceContext {
  prompt: string;
  intent: string;
  monetisable: boolean;
  candidateCount: number;
  blockedCount: number;
  winnerId?: string;
  suppressed: boolean;
  apiFailure: boolean;
}

export function buildTrace(
  ctx: TraceContext,
  timings: TraceTimings
): TraceRow[] {
  const rows: TraceRow[] = [
    {
      step: "check_prompt_safety()",
      inputSummary: `prompt="${truncate(ctx.prompt, 60)}"`,
      outputSummary: ctx.monetisable
        ? "safe_commercial — monetisable"
        : "vulnerability — auction suppressed",
      policyId: ctx.monetisable ? undefined : "PROMPT_VULNERABILITY_SUPPRESS",
      confidence: ctx.monetisable ? 0.91 : 0.96,
      latencyMs: timings.promptSafetyMs,
      status: ctx.monetisable ? "pass" : "blocked",
    },
    {
      step: "classify_intent()",
      inputSummary: `prompt length=${ctx.prompt.length}`,
      outputSummary: `intent=${ctx.intent}`,
      confidence: 0.93,
      latencyMs: timings.intentMs,
      status: "pass",
    },
  ];

  if (ctx.suppressed) {
    rows.push({
      step: "fetch_ad_candidates()",
      inputSummary: "skipped — prompt not monetisable",
      outputSummary: "No ad request made",
      policyId: "PROMPT_VULNERABILITY_SUPPRESS",
      confidence: 1,
      latencyMs: 0,
      status: "blocked",
    });
    rows.push({
      step: "generate_receipt()",
      inputSummary: "suppression path",
      outputSummary: "Placement decision: Suppressed",
      confidence: 1,
      latencyMs: timings.receiptMs ?? 0,
      status: "pass",
    });
    rows.push({
      step: "log_attribution()",
      inputSummary: "suppression event",
      outputSummary: "suppression_logged",
      confidence: 1,
      latencyMs: timings.attributionMs ?? 0,
      status: "pass",
    });
    return rows;
  }

  if (ctx.apiFailure) {
    rows.push({
      step: "fetch_ad_candidates()",
      inputSummary: `intent=${ctx.intent}`,
      outputSummary: "Thrad API failure — no candidates",
      confidence: 0,
      latencyMs: timings.candidatesMs ?? 0,
      status: "error",
    });
    return rows;
  }

  rows.push(
    {
      step: "fetch_ad_candidates()",
      inputSummary: `intent=${ctx.intent}`,
      outputSummary: `${ctx.candidateCount} candidates retrieved`,
      confidence: 0.88,
      latencyMs: timings.candidatesMs ?? 0,
      status: "pass",
    },
    {
      step: "ground_claims()",
      inputSummary: "Tavily/stub claim checks",
      outputSummary: "Claims grounded for all candidates",
      confidence: 0.87,
      latencyMs: timings.claimGroundingMs ?? 0,
      status: "pass",
    },
    {
      step: "check_candidate_safety()",
      inputSummary: `${ctx.candidateCount} candidates`,
      outputSummary: `${ctx.blockedCount} blocked, ${ctx.candidateCount - ctx.blockedCount} survivors`,
      confidence: 0.9,
      latencyMs: timings.candidateSafetyMs ?? 0,
      status: "pass",
    },
    {
      step: "score_survivors()",
      inputSummary: "eligible survivors only",
      outputSummary: ctx.winnerId
        ? `winner=${ctx.winnerId}`
        : "no winner — NO_SAFE_ADS",
      confidence: ctx.winnerId ? 0.92 : 0.5,
      latencyMs: timings.scoringMs ?? 0,
      status: ctx.winnerId ? "pass" : "blocked",
    },
    {
      step: "generate_receipt()",
      inputSummary: "placement outcome",
      outputSummary: ctx.winnerId ? "Placement decision: Served" : "Suppressed",
      confidence: 0.95,
      latencyMs: timings.receiptMs ?? 0,
      status: "pass",
    },
    {
      step: "log_attribution()",
      inputSummary: "impression_created",
      outputSummary: "Attribution event recorded",
      confidence: 1,
      latencyMs: timings.attributionMs ?? 0,
      status: "pass",
    }
  );

  return rows;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}
