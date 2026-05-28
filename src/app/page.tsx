"use client";

import { AttributionLog } from "@/components/AttributionLog";
import { CandidateAuction } from "@/components/CandidateAuction";
import { ChatPanel } from "@/components/ChatPanel";
import { CompareSummary } from "@/components/CompareSummary";
import { DemoBar } from "@/components/DemoBar";
import { IntegrationBadges } from "@/components/IntegrationBadges";
import { PipelinePanel } from "@/components/PipelinePanel";
import { SponsoredResponse } from "@/components/SponsoredResponse";
import { TracePanel } from "@/components/TracePanel";
import { TransparencyReceipt } from "@/components/TransparencyReceipt";
import {
  SAFE_COMMERCIAL_PROMPT,
  VULNERABLE_PROMPT,
} from "@/data/demoPrompts";
import type {
  AttributionEvent,
  IntegrationStatus,
  PipelineResult,
} from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";

  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [safeSnapshot, setSafeSnapshot] = useState<PipelineResult | null>(null);
  const [vulnSnapshot, setVulnSnapshot] = useState<PipelineResult | null>(null);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [extraEvents, setExtraEvents] = useState<AttributionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [forceNoSafeAds, setForceNoSafeAds] = useState(false);
  const [simulateApiFailure, setSimulateApiFailure] = useState(false);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const auctionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/integrations")
      .then((r) => r.json())
      .then((data: IntegrationStatus) => setIntegrationStatus(data));
  }, []);

  const animateSteps = useCallback((stepsLength: number) => {
    setVisibleStepCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleStepCount(count);
      if (count >= stepsLength) clearInterval(interval);
    }, 150);
  }, []);

  const scrollToHighlight = useCallback((suppressed: boolean) => {
    setTimeout(() => {
      if (suppressed) {
        receiptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        auctionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 400);
  }, []);

  const runPipeline = useCallback(
    async (text: string, kind?: "safe" | "vulnerable") => {
      setLoading(true);
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            forceNoSafeAds,
            simulateApiFailure,
          }),
        });
        if (!res.ok) throw new Error("Pipeline failed");
        const data = (await res.json()) as PipelineResult;
        setResult(data);
        setPrompt(text);
        animateSteps(data.steps.length);
        scrollToHighlight(data.auctionSuppressed);

        if (kind === "safe" || text === SAFE_COMMERCIAL_PROMPT) {
          setSafeSnapshot(data);
        }
        if (kind === "vulnerable" || text === VULNERABLE_PROMPT) {
          setVulnSnapshot(data);
        }

        setExtraEvents((prev) => {
          const opened: AttributionEvent = {
            id: `evt_${Date.now()}_receipt`,
            type: "receipt_opened",
            timestamp: new Date().toISOString(),
            impressionId: data.impressionId,
            detail: `Receipt: ${data.receipt.placementDecision}`,
          };
          if (
            prev.some(
              (e) =>
                e.type === "receipt_opened" && e.impressionId === data.impressionId
            )
          ) {
            return prev;
          }
          return [...prev, opened];
        });
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [
      animateSteps,
      forceNoSafeAds,
      scrollToHighlight,
      simulateApiFailure,
    ]
  );

  const handleReset = () => {
    setPrompt("");
    setResult(null);
    setSafeSnapshot(null);
    setVulnSnapshot(null);
    setVisibleStepCount(0);
    setExtraEvents([]);
    setForceNoSafeAds(false);
    setSimulateApiFailure(false);
  };

  const allEvents = [...(result?.attributionEvents ?? []), ...extraEvents];

  const addEvent = (type: AttributionEvent["type"], detail: string) => {
    setExtraEvents((prev) => [
      ...prev,
      {
        id: `evt_${Date.now()}_${type}`,
        type,
        timestamp: new Date().toISOString(),
        impressionId: result?.impressionId,
        detail,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GlassBox SSP</h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Publisher-side trust and measurement for AI-native ads — safety is a
              hard gate, not a scoring penalty.
            </p>
          </div>
          <IntegrationBadges
            status={result?.integrations ?? integrationStatus}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-4">
        <DemoBar
          loading={loading}
          onSafe={() => void runPipeline(SAFE_COMMERCIAL_PROMPT, "safe")}
          onVulnerable={() => void runPipeline(VULNERABLE_PROMPT, "vulnerable")}
          onReset={handleReset}
        />

        <CompareSummary safe={safeSnapshot} vulnerable={vulnSnapshot} />

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <ChatPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              onRunSafe={() => void runPipeline(SAFE_COMMERCIAL_PROMPT, "safe")}
              onRunVulnerable={() =>
                void runPipeline(VULNERABLE_PROMPT, "vulnerable")
              }
              onReset={handleReset}
              onRun={() => void runPipeline(prompt)}
              loading={loading}
              forceNoSafeAds={forceNoSafeAds}
              onForceNoSafeAdsChange={setForceNoSafeAds}
              simulateApiFailure={simulateApiFailure}
              onSimulateApiFailureChange={setSimulateApiFailure}
              showAdvanced={debug}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <PipelinePanel
              steps={result?.steps ?? []}
              visibleCount={result ? visibleStepCount : 0}
            />
            <div ref={auctionRef}>
              <CandidateAuction
                candidates={result?.candidates ?? []}
                message={result?.candidateMessage}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <SponsoredResponse
              assistant={result?.assistantMessage ?? null}
              sponsored={result?.sponsored ?? null}
            />
            <div ref={receiptRef}>
              <TransparencyReceipt
                receipt={result?.receipt ?? null}
                impressionId={result?.impressionId}
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <AttributionLog
              events={allEvents}
              impressionId={result?.impressionId}
              onSimulateClick={() =>
                addEvent(
                  "sponsored_link_clicked",
                  "User clicked sponsored link"
                )
              }
              onSimulateConversion={() =>
                addEvent("conversion_recorded", "Conversion pixel fired")
              }
            />
          </div>

          <div className="lg:col-span-6">
            <TracePanel result={result} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading GlassBox…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
