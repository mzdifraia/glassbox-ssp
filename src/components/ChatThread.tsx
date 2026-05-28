"use client";

import type { PipelineResult } from "@/lib/types";

interface ChatThreadProps {
  userPrompt: string | null;
  liveStatus: string | null;
  loading: boolean;
  assistantText: string;
  typingAssistant: boolean;
  result: PipelineResult | null;
}

export function ChatThread({
  userPrompt,
  liveStatus,
  loading,
  assistantText,
  typingAssistant,
  result,
}: ChatThreadProps) {
  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Conversation
      </h2>
      <div className="mt-3 space-y-3">
        {userPrompt && (
          <div className="flex justify-end">
            <div className="max-w-[90%] rounded-2xl rounded-br-md bg-cyan-900/40 px-4 py-2 text-sm text-zinc-100">
              {userPrompt}
            </div>
          </div>
        )}

        {(loading || liveStatus || assistantText) && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm">
              {loading && liveStatus && (
                <p className="mb-2 flex items-center gap-2 text-xs text-cyan-300/90">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  {liveStatus}
                </p>
              )}
              {assistantText ? (
                <p className="leading-relaxed text-zinc-300">
                  {assistantText}
                  {typingAssistant && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400" />
                  )}
                </p>
              ) : loading ? (
                <p className="text-zinc-500">GlassBox is evaluating…</p>
              ) : null}

              {result?.sponsored.served && result.sponsored.body && !typingAssistant && (
                <div className="mt-3 rounded-lg border border-cyan-700/40 bg-cyan-950/30 p-3">
                  <div className="text-[10px] font-semibold uppercase text-cyan-400">
                    {result.sponsored.label}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs text-zinc-300">
                    {result.sponsored.body}
                  </p>
                </div>
              )}

              {result && !result.sponsored.served && !typingAssistant && (
                <p className="mt-3 text-xs text-amber-200/90">
                  {result.sponsored.explanation}
                </p>
              )}
            </div>
          </div>
        )}

        {!userPrompt && (
          <p className="text-sm text-zinc-500">
            Run a policy test case to start the conversation.
          </p>
        )}
      </div>
    </section>
  );
}
