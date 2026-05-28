"use client";

import { AttributionLog } from "@/components/AttributionLog";
import { CandidateAuction } from "@/components/CandidateAuction";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatThread } from "@/components/ChatThread";
import { CompareSummary } from "@/components/CompareSummary";
import { RunContextBar } from "@/components/RunContextBar";
import { DemoBar } from "@/components/DemoBar";
import { IntegrationBadges } from "@/components/IntegrationBadges";
import { TechnicalOverview } from "@/components/TechnicalOverview";
import { PipelinePanel } from "@/components/PipelinePanel";
import { DemoRunStatus } from "@/components/DemoRunStatus";
import { PolicyBeat } from "@/components/PolicyBeat";
import { PolicyMoment } from "@/components/PolicyMoment";
import { TracePanel } from "@/components/TracePanel";
import { TransparencyReceipt } from "@/components/TransparencyReceipt";
import { useGlassBoxDemo } from "@/hooks/useGlassBoxDemo";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useSearchParams } from "next/navigation";
import type { DemoRunStatusView } from "@/lib/demo/demoRunState";
import { Suspense, useEffect } from "react";

function panelSubtitle(
  status: DemoRunStatusView,
  panel: "chat" | "pipeline" | "auction" | "receipt"
): string | undefined {
  if (status.phase === "idle") return undefined;
  const base = `Scenario ${status.scenarioShort} · ${status.phase}`;
  if (status.phase !== "pipeline" && status.phase !== "settled") {
    return base;
  }
  const map = {
    chat: "chat",
    pipeline: "pipeline",
    auction: "auction",
    receipt: "receipt",
  };
  if (status.watching.toLowerCase().includes(map[panel])) {
    return `${base} · active panel`;
  }
  return `${base} · background`;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "1";
  const walkthrough =
    searchParams.get("walkthrough") === "1" ||
    searchParams.get("presenter") === "1";
  const frozenFromUrl =
    searchParams.get("frozen") === "1" ||
    searchParams.get("deterministic") === "1";
  const seedFromUrl = searchParams.get("seed") ?? "";
  const fast = searchParams.get("fast") === "1";
  const demo = useGlassBoxDemo({ paced: !fast });

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
    demo.paced ? 32 : 12
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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(34,211,238,0.08),transparent_55%)]"
        aria-hidden
      />

      <header className="relative border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
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
              <a
                href="https://glassbox-ssp.vercel.app/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-emerald-800/50 px-2 py-0.5 text-[10px] text-emerald-500/90 hover:text-emerald-300"
              >
                Live
              </a>
            </div>
            {!walkthrough && (
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Next.js · TypeScript · streaming pipeline API
              </p>
            )}
          </div>
          <IntegrationBadges
            status={demo.result?.integrations ?? demo.integrationStatus}
          />
        </div>
      </header>

      <main className="relative mx-auto max-w-[1600px] space-y-4 p-4">
        {demo.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {demo.error}
          </div>
        )}

        <PolicyBeat compact={walkthrough} />

        <TechnicalOverview
          status={demo.result?.integrations ?? demo.integrationStatus}
          lastRunMs={demo.result?.durationMs}
        />

        <DemoBar
          loading={demo.loading}
          onSafe={demo.runSafe}
          onVulnerable={demo.runVulnerable}
          onFullStory={() => void demo.runFullStory()}
          onReset={demo.reset}
          storyComplete={demo.storyComplete}
          walkthrough={walkthrough}
          activeScenario={demo.activeScenario}
        />

        <DemoRunStatus status={demo.runStatus} />

        <CompareSummary safe={demo.safeSnapshot} vulnerable={demo.vulnSnapshot} />

        <PolicyMoment
          result={demo.result}
          loading={demo.loading}
          showAfterTyping={demo.paced}
          typingAssistant={demo.typingAssistant}
        />

        {demo.result && <RunContextBar result={demo.result} />}

        <div className="grid gap-4 lg:grid-cols-12">
          {!walkthrough && (
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
            className={`flex flex-col gap-4 ${walkthrough ? "lg:col-span-6" : "lg:col-span-4"}`}
          >
            <ChatThread
              userPrompt={demo.activePrompt}
              liveStatus={demo.liveStatus}
              loading={demo.loading}
              assistantText={assistantDisplayed}
              typingAssistant={demo.typingAssistant}
              result={demo.result}
              panelSubtitle={panelSubtitle(demo.runStatus, "chat")}
              highlight={demo.runStatus.watching.includes("Chat")}
            />
            <PipelinePanel
              steps={demo.stepsForPanel}
              visibleCount={demo.stepsForPanel.length}
              loading={demo.loading}
              durationMs={demo.result?.durationMs}
              paced={demo.paced}
              panelSubtitle={panelSubtitle(demo.runStatus, "pipeline")}
              highlight={demo.runStatus.watching.includes("pipeline")}
            />
          </div>

          <div
            className={`flex flex-col gap-4 ${walkthrough ? "lg:col-span-6" : "lg:col-span-5"}`}
          >
            {(demo.candidatesForPanel.length > 0 || !demo.loading) && (
              <div ref={demo.auctionRef}>
                <CandidateAuction
                  candidates={demo.candidatesForPanel}
                  message={demo.result?.candidateMessage}
                  panelSubtitle={panelSubtitle(demo.runStatus, "auction")}
                  highlight={
                    demo.runStatus.watching.includes("Auction") ||
                    demo.runStatus.watching.includes("auction")
                  }
                />
              </div>
            )}
            <div ref={demo.receiptRef}>
              <TransparencyReceipt
                receipt={demo.result?.receipt ?? null}
                impressionId={demo.result?.impressionId}
                panelSubtitle={panelSubtitle(demo.runStatus, "receipt")}
                highlight={demo.runStatus.watching.includes("receipt")}
              />
            </div>
          </div>
        </div>

        {!walkthrough && (
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

        {walkthrough && demo.result && (
          <div className="flex justify-center pb-6">
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
