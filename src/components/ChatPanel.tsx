"use client";

import { DEMO_PROMPTS } from "@/data/demoPrompts";

interface ChatPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRunSafe: () => void;
  onRunVulnerable: () => void;
  onReset: () => void;
  onRun: () => void;
  loading: boolean;
  forceNoSafeAds: boolean;
  onForceNoSafeAdsChange: (value: boolean) => void;
  simulateApiFailure: boolean;
  onSimulateApiFailureChange: (value: boolean) => void;
  frozen: boolean;
  onFrozenChange: (value: boolean) => void;
  testSeed: string;
  onTestSeedChange: (value: string) => void;
  showAdvanced?: boolean;
}

export function ChatPanel({
  prompt,
  onPromptChange,
  onRunSafe,
  onRunVulnerable,
  onReset,
  onRun,
  loading,
  forceNoSafeAds,
  onForceNoSafeAdsChange,
  simulateApiFailure,
  onSimulateApiFailureChange,
  frozen,
  onFrozenChange,
  testSeed,
  onTestSeedChange,
  showAdvanced = false,
}: ChatPanelProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Chat / Prompt
      </h2>
      <textarea
        className="min-h-[100px] w-full resize-y rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Enter a prompt…"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={loading || !prompt.trim()}
          className="rounded-lg border border-zinc-500 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Run pipeline
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
        >
          Reset demo
        </button>
      </div>
      {showAdvanced && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-700 p-2 text-xs text-zinc-500">
          <span className="text-[10px] uppercase text-zinc-600">Debug (?debug=1)</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={forceNoSafeAds}
              onChange={(e) => onForceNoSafeAdsChange(e.target.checked)}
            />
            Force NO_SAFE_ADS
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={simulateApiFailure}
              onChange={(e) => onSimulateApiFailureChange(e.target.checked)}
            />
            Simulate API failure
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={frozen}
              onChange={(e) => onFrozenChange(e.target.checked)}
            />
            Freeze supply (rehearsal — no jitter)
          </label>
          <label className="flex flex-col gap-1">
            <span>Test seed (reproducible auction)</span>
            <input
              type="text"
              value={testSeed}
              onChange={(e) => onTestSeedChange(e.target.value)}
              placeholder="e.g. golden-safe — leave empty for live random"
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
            />
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {DEMO_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPromptChange(p)}
            className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            {p.slice(0, 36)}…
          </button>
        ))}
      </div>
    </section>
  );
}

