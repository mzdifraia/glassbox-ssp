"use client";

import {
  PIPELINE_STEP_IDS,
  PIPELINE_STEP_NAMES,
} from "@/lib/pipeline/constants";
import type { IntegrationStatus } from "@/lib/types";
import { useState } from "react";

interface TechnicalOverviewProps {
  status: IntegrationStatus | null;
  lastRunMs?: number;
  defaultOpen?: boolean;
}

const API_ROUTES = [
  { method: "POST", path: "/api/run/stream", note: "NDJSON pipeline events" },
  { method: "POST", path: "/api/run", note: "Full JSON result" },
  { method: "GET", path: "/api/health", note: "Integration probe" },
  { method: "GET", path: "/api/integrations", note: "Env wiring status" },
] as const;

const MODULES = [
  "src/lib/pipeline/runPipeline.ts — orchestrator",
  "src/lib/safety/ — prompt + candidate gates",
  "src/lib/claims/ — hard block + Tavily grounding",
  "src/lib/scoring/ — composite auction score",
  "src/lib/ads/ — StubAdProvider (Thrad adapter for GTM)",
  "overmind/policies.md + dataset.json — eval fixtures",
] as const;

export function TechnicalOverview({
  status,
  lastRunMs,
  defaultOpen = false,
}: TechnicalOverviewProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-sans"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          System reference
        </span>
        <span className="text-[10px] text-zinc-600">
          {open ? "Hide" : "Show"} · same content as{" "}
          <a
            href="https://github.com/mzdifraia/glassbox-ssp#architecture"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 hover:text-cyan-400"
            onClick={(e) => e.stopPropagation()}
          >
            README
          </a>
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-4 pb-4">
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div>
              <h3 className="text-[10px] uppercase text-zinc-500">
                Pipeline ({PIPELINE_STEP_NAMES.length} gates)
              </h3>
              <ol className="mt-2 space-y-0.5 text-zinc-400">
                {PIPELINE_STEP_NAMES.map((name, i) => (
                  <li key={PIPELINE_STEP_IDS[i]}>
                    <span className="text-zinc-600">{i + 1}.</span>{" "}
                    <span className="text-cyan-600/80">{PIPELINE_STEP_IDS[i]}</span>{" "}
                    {name}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-[10px] uppercase text-zinc-500">HTTP API</h3>
              <ul className="mt-2 space-y-1.5 text-zinc-400">
                {API_ROUTES.map((r) => (
                  <li key={r.path}>
                    <span className="text-emerald-500/90">{r.method}</span> {r.path}
                    <div className="font-sans text-[10px] text-zinc-600">
                      {r.note}
                    </div>
                  </li>
                ))}
              </ul>
              {lastRunMs != null && (
                <p className="mt-2 text-zinc-500">
                  Last run:{" "}
                  <span className="text-zinc-300">{lastRunMs}ms</span> wall-clock
                </p>
              )}
            </div>

            <div>
              <h3 className="text-[10px] uppercase text-zinc-500">Integrations</h3>
              {status ? (
                <dl className="mt-2 space-y-1 text-zinc-400">
                  <Row k="Auction" v={status.supply} />
                  <Row k="Inventory" v={status.inventory} />
                  <Row k="Tavily" v={status.tavily} />
                  <Row k="Claim checks" v={status.claimGrounding} />
                  <Row k="Thrad" v={status.thrad} />
                  <Row k="Trace export" v={status.overmind} />
                </dl>
              ) : (
                <p className="mt-2 text-zinc-600">Loading…</p>
              )}
              <h3 className="mt-3 text-[10px] uppercase text-zinc-500">
                Code layout
              </h3>
              <ul className="mt-1 space-y-0.5 text-zinc-500">
                {MODULES.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-zinc-600">{k}</dt>
      <dd className="text-right text-zinc-300">{v}</dd>
    </div>
  );
}
