"use client";

import type { TransparencyReceipt as ReceiptType } from "@/lib/types";

interface TransparencyReceiptProps {
  receipt: ReceiptType | null;
  impressionId?: string;
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-zinc-500">{title}</h3>
      <ul className="mt-1 space-y-0.5 text-sm text-zinc-300">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TransparencyReceipt({
  receipt,
  impressionId,
}: TransparencyReceiptProps) {
  return (
    <section className="rounded-xl border-2 border-cyan-800/40 bg-zinc-900/90 p-4 shadow-lg shadow-cyan-950/20">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cyan-400">
        Transparency receipt
      </h2>
      <p className="mb-4 text-[10px] text-zinc-500">
        The most important UI — every placement explained
      </p>
      {!receipt ? (
        <p className="text-sm text-zinc-500">Receipt appears after pipeline run</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <span className="text-zinc-500">Placement decision</span>
              <p
                className={`font-semibold ${
                  receipt.placementDecision === "Served"
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {receipt.placementDecision}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Intent</span>
              <p className="font-mono text-zinc-200">{receipt.intent}</p>
            </div>
            <div>
              <span className="text-zinc-500">Monetisable</span>
              <p className="text-zinc-200">
                {receipt.monetisable ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Ad request made</span>
              <p className="text-zinc-200">
                {receipt.adRequestMade ? "Yes" : "No"}
              </p>
            </div>
          </div>
          {impressionId && (
            <p className="font-mono text-[10px] text-zinc-500">
              Impression: {impressionId}
            </p>
          )}
          {receipt.suppressionReason && (
            <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-amber-200">
              {receipt.suppressionReason}
            </div>
          )}
          {receipt.winnerAdvertiser && (
            <p className="text-zinc-300">
              Winner: <strong>{receipt.winnerAdvertiser}</strong>
            </p>
          )}
          <ListSection title="Why this ad won" items={receipt.whyThisAdWon} />
          <ListSection title="Why others lost" items={receipt.whyOthersLost} />
          <ListSection title="Data used" items={receipt.dataUsed} />
          <ListSection title="Data stored" items={receipt.dataStored} />
          <ListSection title="Data not stored" items={receipt.dataNotStored} />
        </div>
      )}
    </section>
  );
}
