"use client";

import {
  detectPolicyMoment,
  type PolicyMoment,
} from "@/lib/demo/detectPolicyMoment";
import type { PipelineResult } from "@/lib/types";

interface PolicyMomentProps {
  result: PipelineResult | null;
  loading?: boolean;
  /** Wait until typing finished so spotlight does not compete with pipeline. */
  showAfterTyping?: boolean;
  typingAssistant?: boolean;
}

function MomentCard({ moment }: { moment: PolicyMoment }) {
  const isPolicy = moment.tone === "policy-win";

  return (
    <div
      className={`animate-moment-in rounded-xl border px-4 py-4 sm:px-5 ${
        isPolicy
          ? "border-amber-500/40 bg-gradient-to-br from-amber-950/50 to-zinc-900/80 shadow-lg shadow-amber-950/30"
          : "border-amber-600/50 bg-gradient-to-br from-amber-950/60 to-red-950/30 shadow-lg shadow-red-950/20"
      }`}
      role="status"
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-widest ${
          isPolicy ? "text-amber-300" : "text-amber-200"
        }`}
      >
        {isPolicy ? "Trust before revenue" : "Vulnerability beat"}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-50">
        {moment.headline}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        {moment.detail}
      </p>
      {moment.metric && (
        <p className="mt-3 font-mono text-xs text-cyan-300/90">{moment.metric}</p>
      )}
    </div>
  );
}

export function PolicyMoment({
  result,
  loading,
  showAfterTyping,
  typingAssistant,
}: PolicyMomentProps) {
  if (loading) return null;
  if (showAfterTyping && typingAssistant) return null;
  const moment = detectPolicyMoment(result);
  if (!moment) return null;
  return <MomentCard moment={moment} />;
}
