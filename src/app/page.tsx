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
import { useGlassBoxDemo } from "@/hooks/useGlassBoxDemo";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const debug = useSearchParams().get("debug") === "1";
  const demo = useGlassBoxDemo();

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
              Publisher-side trust and measurement for AI-native ads — safety is a
              hard gate, not a scoring penalty.
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
          loadingLabel={
            demo.result?.integrations.tavily === "live"
              ? "Grounding claims (Tavily)…"
              : "Running pipeline…"
          }
          onSafe={demo.runSafe}
          onVulnerable={demo.runVulnerable}
          onReset={demo.reset}
        />

        <CompareSummary safe={demo.safeSnapshot} vulnerable={demo.vulnSnapshot} />

        <div className="grid gap-4 lg:grid-cols-12">
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
              showAdvanced={debug}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <PipelinePanel
              steps={demo.result?.steps ?? []}
              visibleCount={demo.result ? demo.visibleStepCount : 0}
              loading={demo.loading}
              durationMs={demo.result?.durationMs}
            />
            <div ref={demo.auctionRef}>
              <CandidateAuction
                candidates={demo.result?.candidates ?? []}
                message={demo.result?.candidateMessage}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <SponsoredResponse
              assistant={demo.result?.assistantMessage ?? null}
              sponsored={demo.result?.sponsored ?? null}
            />
            <div ref={demo.receiptRef}>
              <TransparencyReceipt
                receipt={demo.result?.receipt ?? null}
                impressionId={demo.result?.impressionId}
              />
            </div>
          </div>

          <div className="lg:col-span-6">
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
          </div>

          <div className="lg:col-span-6">
            <TracePanel result={demo.result} />
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
