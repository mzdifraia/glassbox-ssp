export type PromptSafetyCategory =
  | "financial_distress"
  | "medical_vulnerability"
  | "mental_health_crisis"
  | "grief"
  | "legal_distress"
  | "child_safety"
  | "safe_commercial";

export type CandidateSafetyReason =
  | "unsupported_claim"
  | "unsafe_category"
  | "low_relevance"
  | "manipulative_wording"
  | "competitor_hijack"
  | "passed";

export type CandidateStatus = "eligible" | "blocked" | "winner" | "lost";

export type PipelineStepStatus =
  | "pending"
  | "passed"
  | "blocked"
  | "failed"
  | "skipped";

export type TraceStatus = "pass" | "blocked" | "error";

export interface AdCandidate {
  id: string;
  advertiser: string;
  title: string;
  body: string;
  url: string;
  category: string;
  bidCents: number;
  relevanceScore: number;
  qualityScore: number;
  status: CandidateStatus;
  reason: string;
  claims: string[];
  compositeScore?: number;
}

export interface PromptSafetyResult {
  category: PromptSafetyCategory;
  monetisable: boolean;
  confidence: number;
  reason: string;
  policyId: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  reason: string;
}

export interface ClaimCheckResult {
  supported: boolean;
  checkedClaims: string[];
  reason: string;
}

export interface IntegrationStatus {
  thrad: "live" | "stub";
  tavily: "live" | "stub";
  claimGrounding: "hybrid" | "stub" | "tavily";
  overmind: "export-ready";
  cursor: "built-with";
}

export interface CandidateSafetyResult {
  safe: boolean;
  reason: CandidateSafetyReason;
  detail: string;
  policyId?: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: PipelineStepStatus;
  confidence: number;
  reason: string;
  latencyMs: number;
}

export interface TraceRow {
  step: string;
  inputSummary: string;
  outputSummary: string;
  policyId?: string;
  confidence: number;
  latencyMs: number;
  status: TraceStatus;
}

export interface AttributionEvent {
  id: string;
  type:
    | "impression_created"
    | "receipt_opened"
    | "sponsored_link_clicked"
    | "conversion_recorded"
    | "suppression_logged";
  timestamp: string;
  impressionId?: string;
  detail?: string;
}

export interface TransparencyReceipt {
  placementDecision: "Served" | "Suppressed";
  intent: string;
  monetisable: boolean;
  adRequestMade: boolean;
  whyThisAdWon: string[];
  whyOthersLost: string[];
  dataUsed: string[];
  dataStored: string[];
  dataNotStored: string[];
  suppressionReason?: string;
  winnerAdvertiser?: string;
}

export interface SponsoredContent {
  served: boolean;
  label: string;
  headline: string;
  body: string;
  explanation: string;
  advertiser?: string;
  url?: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
  hasSponsored: boolean;
}

export interface PipelineResult {
  prompt: string;
  impressionId: string;
  traceId?: string;
  monetisable: boolean;
  auctionSuppressed: boolean;
  apiFailure: boolean;
  noSafeAds: boolean;
  steps: PipelineStep[];
  candidates: AdCandidate[];
  candidateMessage?: string;
  sponsored: SponsoredContent;
  assistantMessage: AssistantMessage;
  receipt: TransparencyReceipt;
  attributionEvents: AttributionEvent[];
  trace: TraceRow[];
  intent: IntentResult;
  promptSafety: PromptSafetyResult;
  integrations: IntegrationStatus;
}

export interface RunPipelineOptions {
  simulateApiFailure?: boolean;
  forceNoSafeAds?: boolean;
}
