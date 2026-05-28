"use client";

import { AttributionLog } from "@/components/AttributionLog";
import { CandidateAuction } from "@/components/CandidateAuction";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatThread } from "@/components/ChatThread";
import { CompareSummary } from "@/components/CompareSummary";
import { RunContextBar } from "@/components/RunContextBar";
import { DemoBar } from "@/components/DemoBar";
import { IntegrationBadges } from "@/components/IntegrationBadges";
import { PipelinePanel } from "@/components/PipelinePanel";
import { TracePanel } from "@/components/TracePanel";
import { TransparencyReceipt } from "@/components/TransparencyReceipt";
import { useGlassBoxDemo } from "@/hooks/useGlassBoxDemo";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";
  const presenter = searchParams.get("presenter") === "1";
  const frozenFromUrl =
    searchParams.get("frozen") === "1" ||
    searchParams.get("deterministic") === "1";
  const seedFromUrl = searchParams.get("seed") ?? "";
  const demo = useGlassBoxDemo();

  useEffect(() => {
    if (frozenFromUrl) demo.setFrozen(true);
  }, [frozenFromUrl, demo.setFrozen]);

  useEffect(() => {
    if (seedFromUrl) demo.setTestSeed(seedFromUrl);
  }, [seedFromUrl, demo.setTestSeed]);

  const assistantFull = demo.result?.assistantMessage.content ?? "";
  const assistantDisplayed = useTypewriter(
    assistantFull,
    demo.typingAssistant,
    10
  );

  useEffect(() => {
    if (
      demo.typingAssistant &&
      assistantFull &&
      assistantDisplayed === assistantFull
    ) {
      demo.setTypingAssistant(false);
    }
  }, [
    demo.typingAssistant,
    assistantFull,
    assistantDisplayed,
    demo.setTypingAssistant,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">GlassBox SSP</h1>
              <a
                href="https://github.com/mzdifraia/glassbox-ssp"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
              >
                GitHub
              </a>
            </div>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Policy gates are rule-based. Auction variance is live by default; use a{" "}
              <code className="text-cyan-400/90">seed</code> for reproducible tests (
              <code className="text-cyan-400/90">npm test</code>).
            </p>
          </div>
          <IntegrationBadges
            status={demo.result?.integrations ?? demo.integrationStatus}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-4">
        {demo.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {demo.error}
          </div>
        )}

        <DemoBar
          loading={demo.loading}
          loadingLabel={demo.liveStatus ?? "Running pipeline…"}
          onSafe={demo.runSafe}
          onVulnerable={demo.runVulnerable}
          onReset={demo.reset}
        />

        <CompareSummary safe={demo.safeSnapshot} vulnerable={demo.vulnSnapshot} />

        <RunContextBar result={demo.result} />

        <div className="grid gap-4 lg:grid-cols-12">
          {!presenter && (
            <div className="lg:col-span-3">
              <ChatPanel
                prompt={demo.prompt}
                onPromptChange={demo.setPrompt}
                onRunSafe={demo.runSafe}
                onRunVulnerable={demo.runVulnerable}
                onReset={demo.reset}
                onRun={() => void demo.runPipeline(demo.prompt)}
                loading={demo.loading}
                forceNoSafeAds={demo.forceNoSafeAds}
                onForceNoSafeAdsChange={demo.setForceNoSafeAds}
                simulateApiFailure={demo.simulateApiFailure}
                onSimulateApiFailureChange={demo.setSimulateApiFailure}
                frozen={demo.frozen}
                onFrozenChange={demo.setFrozen}
                testSeed={demo.testSeed}
                onTestSeedChange={demo.setTestSeed}
                showAdvanced={debug}
              />
            </div>
          )}

          <div
            className={`flex flex-col gap-4 ${presenter ? "lg:col-span-5" : "lg:col-span-4"}`}
          >
            <ChatThread
              userPrompt={demo.activePrompt}
              liveStatus={demo.liveStatus}
              loading={demo.loading}
              assistantText={assistantDisplayed}
              typingAssistant={demo.typingAssistant}
              result={demo.result}
            />
            <PipelinePanel
              steps={demo.stepsForPanel}
              visibleCount={demo.stepsForPanel.length}
              loading={demo.loading}
              durationMs={demo.result?.durationMs}
            />
          </div>

          <div className={`flex flex-col gap-4 ${presenter ? "lg:col-span-4" : "lg:col-span-5"}`}>
            <div ref={demo.auctionRef}>
              <CandidateAuction
                candidates={demo.candidatesForPanel}
                message={demo.result?.candidateMessage}
              />
            </div>
            <div ref={demo.receiptRef}>
              <TransparencyReceipt
                receipt={demo.result?.receipt ?? null}
                impressionId={demo.result?.impressionId}
              />
            </div>
          </div>
        </div>

        {!presenter && (
          <div className="grid gap-4 lg:grid-cols-2">
            <AttributionLog
              events={demo.allEvents}
              impressionId={demo.result?.impressionId}
              onSimulateClick={() =>
                demo.addEvent(
                  "sponsored_link_clicked",
                  "User clicked sponsored link"
                )
              }
              onSimulateConversion={() =>
                demo.addEvent("conversion_recorded", "Conversion pixel fired")
              }
            />
            <TracePanel result={demo.result} />
          </div>
        )}
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
