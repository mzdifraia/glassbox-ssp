export const PIPELINE_STEP_NAMES = [
  "Prompt safety gate",
  "Intent classifier",
  "Candidate retrieval",
  "Claim grounding",
  "Candidate safety gate",
  "Scoring",
  "Sponsored response",
  "Receipt",
  "Attribution",
  "Trace",
] as const;

export const PIPELINE_STEP_IDS = [
  "prompt-safety",
  "intent",
  "candidates",
  "claim-grounding",
  "candidate-safety",
  "scoring",
  "sponsored",
  "receipt",
  "attribution",
  "trace",
] as const;
