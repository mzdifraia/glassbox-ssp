"use client";

import type { AssistantMessage, SponsoredContent } from "@/lib/types";

interface SponsoredResponseProps {
  assistant: AssistantMessage | null;
  sponsored: SponsoredContent | null;
}

export function SponsoredResponse({
  assistant,
  sponsored,
}: SponsoredResponseProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Assistant response
      </h2>
      {assistant ? (
        <p className="text-sm leading-relaxed text-zinc-300">
          {assistant.content}
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Run a prompt to see the response</p>
      )}
      {sponsored && (
        <div
          className={`rounded-lg border p-4 ${
            sponsored.served
              ? "border-cyan-700/50 bg-cyan-950/20"
              : "border-zinc-700 bg-zinc-950/40"
          }`}
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            {sponsored.label}
          </div>
          {sponsored.served ? (
            <>
              <h3 className="font-medium text-zinc-100">{sponsored.headline}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-300">
                {sponsored.body}
              </p>
              {sponsored.url && (
                <a
                  href={sponsored.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-cyan-400 hover:underline"
                >
                  {sponsored.url}
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">{sponsored.explanation}</p>
          )}
        </div>
      )}
    </section>
  );
}
