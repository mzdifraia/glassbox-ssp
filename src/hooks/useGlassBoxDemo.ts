"use client";

import {
  SAFE_COMMERCIAL_PROMPT,
  VULNERABLE_PROMPT,
} from "@/data/demoPrompts";
import type {
  AttributionEvent,
  IntegrationStatus,
  PipelineResult,
  PipelineStep,
} from "@/lib/types";
import type { PipelineStreamEvent } from "@/lib/pipeline/streamEvents";
import { useCallback, useEffect, useRef, useState } from "react";

export type DemoKind = "safe" | "vulnerable";

export function useGlassBoxDemo() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [liveSteps, setLiveSteps] = useState<PipelineStep[]>([]);
  const [liveCandidates, setLiveCandidates] = useState<PipelineResult["candidates"]>([]);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [safeSnapshot, setSafeSnapshot] = useState<PipelineResult | null>(null);
  const [vulnSnapshot, setVulnSnapshot] = useState<PipelineResult | null>(null);
  const [extraEvents, setExtraEvents] = useState<AttributionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [forceNoSafeAds, setForceNoSafeAds] = useState(false);
  const [simulateApiFailure, setSimulateApiFailure] = useState(false);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);
  const [typingAssistant, setTypingAssistant] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [testSeed, setTestSeed] = useState("");

  const receiptRef = useRef<HTMLDivElement>(null);
  const auctionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/integrations")
      .then((r) => r.json())
      .then((data: IntegrationStatus) => setIntegrationStatus(data))
      .catch(() => undefined);
  }, []);

  const scrollToHighlight = useCallback((suppressed: boolean) => {
    setTimeout(() => {
      const el = suppressed ? receiptRef.current : auctionRef.current;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
  }, []);

  const runPipeline = useCallback(
    async (text: string, kind?: DemoKind) => {
      setLoading(true);
      setTypingAssistant(false);
      setError(null);
      setActivePrompt(text);
      setPrompt(text);
      setResult(null);
      setLiveSteps([]);
      setLiveCandidates([]);
      setLiveStatus("Starting publisher policy pipeline…");

      try {
        const res = await fetch("/api/run/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            forceNoSafeAds,
            simulateApiFailure,
            frozen,
            deterministic: frozen,
            ...(testSeed.trim() ? { seed: testSeed.trim() } : {}),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Pipeline stream failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalResult: PipelineResult | null = null as PipelineResult | null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as PipelineStreamEvent;
            applyStreamEvent(event, (r) => {
              finalResult = r;
            });
          }
        }

        if (buffer.trim()) {
          const event = JSON.parse(buffer) as PipelineStreamEvent;
          applyStreamEvent(event, (r) => {
            finalResult = r;
          });
        }

        if (!finalResult) {
          throw new Error("No result from pipeline");
        }

        setResult(finalResult);
        setLiveStatus(null);
        setTypingAssistant(true);
        scrollToHighlight(finalResult.auctionSuppressed);

        if (kind === "safe" || text === SAFE_COMMERCIAL_PROMPT) {
          setSafeSnapshot(finalResult);
        }
        if (kind === "vulnerable" || text === VULNERABLE_PROMPT) {
          setVulnSnapshot(finalResult);
        }

        setExtraEvents((prev) => {
          const opened: AttributionEvent = {
            id: `evt_${Date.now()}_receipt`,
            type: "receipt_opened",
            timestamp: new Date().toISOString(),
            impressionId: finalResult!.impressionId,
            detail: `Receipt: ${finalResult!.receipt.placementDecision} (${finalResult!.durationMs}ms)`,
          };
          if (
            prev.some(
              (e) =>
                e.type === "receipt_opened" &&
                e.impressionId === finalResult!.impressionId
            )
          ) {
            return prev;
          }
          return [...prev, opened];
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setResult(null);
        setLiveStatus(null);
      } finally {
        setLoading(false);
      }

      function applyStreamEvent(
        event: PipelineStreamEvent,
        onComplete: (r: PipelineResult) => void
      ) {
        switch (event.type) {
          case "status":
            setLiveStatus(event.message);
            break;
          case "step":
            setLiveSteps((prev) => {
              const idx = prev.findIndex((s) => s.id === event.step.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = event.step;
                return next;
              }
              return [...prev, event.step];
            });
            break;
          case "candidates":
            setLiveCandidates(event.candidates);
            break;
          case "complete":
            setResult(event.result);
            setLiveSteps(event.result.steps);
            setLiveCandidates(event.result.candidates);
            onComplete(event.result);
            break;
          case "error":
            throw new Error(event.message);
        }
      }
    },
    [forceNoSafeAds, frozen, scrollToHighlight, simulateApiFailure, testSeed]
  );

  const runFullStory = useCallback(async () => {
    await runPipeline(SAFE_COMMERCIAL_PROMPT, "safe");
    await new Promise((r) => setTimeout(r, 600));
    await runPipeline(VULNERABLE_PROMPT, "vulnerable");
  }, [runPipeline]);

  const reset = useCallback(() => {
    setPrompt("");
    setResult(null);
    setLiveSteps([]);
    setLiveCandidates([]);
    setLiveStatus(null);
    setActivePrompt(null);
    setSafeSnapshot(null);
    setVulnSnapshot(null);
    setExtraEvents([]);
    setError(null);
    setTypingAssistant(false);
    setFrozen(false);
    setTestSeed("");
    setForceNoSafeAds(false);
    setSimulateApiFailure(false);
  }, []);

  const addEvent = useCallback(
    (type: AttributionEvent["type"], detail: string) => {
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
    },
    [result?.impressionId]
  );

  const allEvents = [...(result?.attributionEvents ?? []), ...extraEvents];

  const stepsForPanel =
    loading && liveSteps.length > 0
      ? liveSteps
      : result?.steps ?? [];

  const candidatesForPanel =
    loading && liveCandidates.length > 0
      ? liveCandidates
      : result?.candidates ?? [];

  return {
    prompt,
    setPrompt,
    result,
    activePrompt,
    liveStatus,
    stepsForPanel,
    candidatesForPanel,
    safeSnapshot,
    vulnSnapshot,
    loading,
    error,
    typingAssistant,
    setTypingAssistant,
    frozen,
    setFrozen,
    testSeed,
    setTestSeed,
    forceNoSafeAds,
    setForceNoSafeAds,
    simulateApiFailure,
    setSimulateApiFailure,
    integrationStatus,
    receiptRef,
    auctionRef,
    runPipeline,
    reset,
    addEvent,
    allEvents,
    runSafe: () => void runPipeline(SAFE_COMMERCIAL_PROMPT, "safe"),
    runVulnerable: () => void runPipeline(VULNERABLE_PROMPT, "vulnerable"),
    runFullStory,
    storyComplete: Boolean(safeSnapshot && vulnSnapshot),
  };
}
