import type { AdCandidate } from "@/lib/types";

export type VarianceMode = "live" | "seeded" | "frozen";

export interface RunVariance {
  readonly mode: VarianceMode;
  /** Present when mode is `seeded` — use in tests and bug reports. */
  readonly seedLabel: string | null;
  /** Uniform random in [0, 1). */
  next(): number;
  pick<T>(items: readonly [T, ...T[]]): T;
}

export interface CreateRunVarianceOptions {
  /** No bid/score jitter — rehearsal baseline. */
  frozen?: boolean;
  /** Reproducible auction noise for tests (`npm test`). Omit for live randomness. */
  seed?: string | number;
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — fast, seedable PRNG for tests. */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFrom<T>(items: readonly [T, ...T[]], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function createRunVariance(
  options: CreateRunVarianceOptions | boolean = {}
): RunVariance {
  const opts: CreateRunVarianceOptions =
    typeof options === "boolean" ? { frozen: options } : options;

  const frozen =
    opts.frozen === true || process.env.DETERMINISTIC_DEMO === "1";

  if (frozen) {
    return {
      mode: "frozen",
      seedLabel: null,
      next: () => 0.5,
      pick: (items) => items[0],
    };
  }

  if (opts.seed !== undefined && opts.seed !== "") {
    const label = String(opts.seed);
    const numeric =
      typeof opts.seed === "number" ? opts.seed >>> 0 : hashSeed(label);
    const rng = createSeededRng(numeric);
    return {
      mode: "seeded",
      seedLabel: label,
      next: rng,
      pick: (items) => pickFrom(items, rng),
    };
  }

  return {
    mode: "live",
    seedLabel: null,
    next: () => Math.random(),
    pick: (items) => pickFrom(items, Math.random),
  };
}

export function supplyModeFromVariance(
  variance: RunVariance
): "live-auction" | "seeded" | "fixed" {
  switch (variance.mode) {
    case "frozen":
      return "fixed";
    case "seeded":
      return "seeded";
    default:
      return "live-auction";
  }
}

export function varianceIsActive(variance: RunVariance): boolean {
  return variance.mode !== "frozen";
}

function clampScore(n: number): number {
  return Math.min(0.98, Math.max(0.2, Math.round(n * 1000) / 1000));
}

function shuffle<T>(items: T[], variance: RunVariance): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(variance.next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Simulates RTB bid / relevance noise — policy gates stay rule-based. */
export function applySupplyVariance(
  candidates: AdCandidate[],
  variance: RunVariance
): AdCandidate[] {
  if (!varianceIsActive(variance)) return candidates;

  const jittered = candidates.map((c) => {
    const bidFactor = 0.9 + variance.next() * 0.22;
    const relDelta = (variance.next() - 0.5) * 0.14;
    const qualDelta = (variance.next() - 0.5) * 0.12;
    return {
      ...c,
      bidCents: Math.max(100, Math.round(c.bidCents * bidFactor)),
      relevanceScore: clampScore(c.relevanceScore + relDelta),
      qualityScore: clampScore(c.qualityScore + qualDelta),
    };
  });

  return shuffle(jittered, variance);
}

export function jitterConfidence(
  base: number,
  variance: RunVariance,
  spread = 0.08
): number {
  if (!varianceIsActive(variance)) return base;
  const v = base + (variance.next() - 0.5) * spread;
  return Math.min(0.99, Math.max(0.72, Math.round(v * 1000) / 1000));
}
