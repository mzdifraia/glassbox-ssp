import type { AdCandidate } from "@/lib/types";
import type { AdProviderInput } from "./AdProvider";

const ADVERTISERS = [
  "Ledgerly",
  "BookShelf",
  "Aligna",
  "Finova",
  "Closepath",
  "Numeric",
  "StackBooks",
  "Pilotline",
] as const;

const TITLES = [
  "Bookkeeping for growing teams",
  "Month-end close platform",
  "Multi-entity GL workspace",
  "AP / AR automation hub",
  "Audit-ready reporting suite",
] as const;

const BODIES = [
  "Bank feeds, approvals, and role-based access for finance teams.",
  "Reconciliation and close checklists with exportable audit trails.",
  "Entity consolidation and intercompany eliminations in one place.",
  "Invoice capture and expense policies for distributed teams.",
] as const;

const SAFE_CLAIMS = [
  ["SOC 2 Type II certified", "Integrates with major banks"],
  ["Built for teams under 50 people", "Supports multi-entity setups"],
  ["Role-based approvals", "Export to common ERP formats"],
  ["Daily bank sync", "Configurable chart of accounts"],
] as const;

const TRAP_ADVERTISERS = ["HyperBooks AI", "QuickLedger Pro", "AutoBooks Max"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
}

function makeCandidate(
  advertiser: string,
  opts: {
    category: string;
    bidCents: number;
    relevance: number;
    quality: number;
    claims: string[];
    trap?: boolean;
  }
): AdCandidate {
  const title = pick(TITLES);
  return {
    id: slug(`${advertiser}-${Date.now()}-${Math.random()}`),
    advertiser,
    title,
    body: pick(BODIES),
    url: `https://${slug(advertiser)}.example.com`,
    category: opts.category,
    bidCents: opts.bidCents,
    relevanceScore: Math.round(opts.relevance * 1000) / 1000,
    qualityScore: Math.round(opts.quality * 1000) / 1000,
    status: "eligible",
    reason: "",
    claims: opts.claims,
  };
}

/**
 * Synthesizes a fresh candidate set per request (runs on Vercel serverless like any API route).
 * Always includes one high-bid trap ad with a hard-blocked claim for accounting intents.
 */
export function generateRandomCandidates(input: AdProviderInput): AdCandidate[] {
  const accounting = input.intent.includes("accounting");
  const count = accounting ? 4 + Math.floor(Math.random() * 2) : 3;
  const out: AdCandidate[] = [];

  if (accounting) {
    out.push(
      makeCandidate(pick(TRAP_ADVERTISERS), {
        category: "b2b.finance.accounting",
        bidCents: Math.round(randBetween(750, 1200)),
        relevance: randBetween(0.78, 0.9),
        quality: randBetween(0.65, 0.78),
        claims: [
          "Guaranteed to reduce accounting costs by 80%",
          "Fully automated bookkeeping with no oversight",
        ],
        trap: true,
      })
    );
  }

  const pool = [...ADVERTISERS].sort(() => Math.random() - 0.5);
  for (let i = 0; out.length < count && i < pool.length; i++) {
    const name = pool[i]!;
    if (accounting && TRAP_ADVERTISERS.includes(name as (typeof TRAP_ADVERTISERS)[number])) {
      continue;
    }
    out.push(
      makeCandidate(name, {
        category: accounting
          ? "b2b.finance.accounting"
          : "general.commercial.research",
        bidCents: Math.round(randBetween(280, 620)),
        relevance: accounting ? randBetween(0.72, 0.96) : randBetween(0.35, 0.7),
        quality: randBetween(0.72, 0.92),
        claims: [...pick(SAFE_CLAIMS)],
      })
    );
  }

  return out;
}
