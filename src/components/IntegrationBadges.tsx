"use client";

import type { IntegrationStatus } from "@/lib/types";

interface IntegrationBadgesProps {
  status: IntegrationStatus | null;
}

function Badge({
  label,
  mode,
}: {
  label: string;
  mode: string;
}) {
  const live = mode === "live";
  const exportReady = mode === "export-ready";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        live
          ? "border-emerald-600/50 bg-emerald-950/50 text-emerald-300"
          : exportReady
            ? "border-violet-600/50 bg-violet-950/50 text-violet-300"
            : "border-zinc-600 bg-zinc-800/80 text-zinc-400"
      }`}
    >
      {label}: {mode}
    </span>
  );
}

export function IntegrationBadges({ status }: IntegrationBadgesProps) {
  if (!status) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge label="Thrad" mode={status.thrad} />
      <Badge label="Tavily" mode={status.tavily} />
      <Badge label="Claims" mode={status.claimGrounding} />
      <Badge label="Overmind" mode={status.overmind} />
      <Badge label="Cursor" mode={status.cursor} />
    </div>
  );
}
