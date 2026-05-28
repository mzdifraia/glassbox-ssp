"use client";

import { buildReproCurl } from "@/lib/run/buildReproCurl";
import type { PipelineResult } from "@/lib/types";
import { useCallback, useState } from "react";

interface RunContextBarProps {
  result: PipelineResult | null;
}

export function RunContextBar({ result }: RunContextBarProps) {
  const [copied, setCopied] = useState(false);

  const copyRepro = useCallback(async () => {
    if (!result) return;
    const curl = buildReproCurl(result.prompt, {
      seed: result.runMeta.auctionSeed,
      frozen: result.runMeta.auctionMode === "fixed",
    });
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  if (!result) return null;

  const { runMeta, impressionId, durationMs } = result;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold uppercase tracking-wide text-zinc-500">
          Run context
        </span>
        <button
          type="button"
          onClick={() => void copyRepro()}
          className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
        >
          {copied ? "Copied repro curl" : "Copy repro curl"}
        </button>
      </div>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase text-zinc-600">Impression</dt>
          <dd className="font-mono text-zinc-300">{impressionId}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-zinc-600">Supply</dt>
          <dd>
            {runMeta.supplyProvider} · {runMeta.auctionMode}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-zinc-600">Auction seed</dt>
          <dd className="font-mono text-zinc-300">
            {runMeta.auctionSeed ?? "live (none)"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-zinc-600">Duration</dt>
          <dd>{(durationMs / 1000).toFixed(2)}s</dd>
        </div>
      </dl>
    </section>
  );
}
