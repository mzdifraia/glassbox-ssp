"use client";

import type { IntegrationStatus } from "@/lib/types";

interface DemoDisclaimerProps {
  status: IntegrationStatus | null;
}

export function DemoDisclaimer({ status }: DemoDisclaimerProps) {
  const inventory = status?.inventory;

  return (
    <footer className="border-t border-zinc-800/60 px-1 pt-4 pb-8 text-[11px] leading-relaxed text-zinc-600">
      <p className="max-w-3xl">
        <span className="font-medium text-zinc-500">Demo note.</span> Candidates
        are synthesized per run from templates and random picks — not
        LLM-written ad copy. Policy gates (blocks, suppressions, receipts) are
        enforced in pipeline code, not cosmetic UI labels.{" "}
        <a
          href="https://github.com/mzdifraia/glassbox-ssp/blob/master/src/lib/ads/generateRandomCandidates.ts"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-400"
        >
          Supply generator
        </a>
        {" · "}
        <a
          href="https://github.com/mzdifraia/glassbox-ssp/blob/master/overmind/policies.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-400"
        >
          Policies
        </a>
        {inventory === "random" && (
          <span className="text-zinc-500">
            {" "}
            · Inventory is random on this deploy.
          </span>
        )}
        {inventory === "catalog" && (
          <span className="text-zinc-500">
            {" "}
            · Fixed stub catalog on this deploy.
          </span>
        )}
      </p>
    </footer>
  );
}
