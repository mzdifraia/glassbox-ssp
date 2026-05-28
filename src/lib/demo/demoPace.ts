/** Client-side pacing so judges can follow the pipeline (server stays full speed). */
export const DEMO_PACE = {
  msBetweenSteps: 1100,
  msOnStatus: 700,
  msOnCandidates: 900,
  msAfterComplete: 1400,
  msBeforeTyping: 800,
  msBeforeScroll: 600,
  msBetweenStoryBeats: 4000,
  typewriterMsPerChar: 32,
  typewriterMsPerCharFast: 12,
} as const;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
