"use client";

import {
  SAFE_COMMERCIAL_PROMPT,
  VULNERABLE_PROMPT,
} from "@/data/demoPrompts";
import type {
  AttributionEvent,
  IntegrationStatus,
  PipelineResult,
} from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type DemoKind = "safe" | "vulnerable";

export function useGlassBoxDemo() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [safeSnapshot, setSafeSnapshot] = useState<PipelineResult | null>(null);
  const [vulnSnapshot, setVulnSnapshot] = useState<PipelineResult | null>(null);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [extraEvents, setExtraEvents] = useState<AttributionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceNoSafeAds, setForceNoSafeAds] = useState(false);
  const [simulateApiFailure, setSimulateApiFailure] = useState(false);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const auctionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/integrations")
      .then((r) => r.json())
      .then((data: IntegrationStatus) => setIntegrationStatus(data))
      .catch(() => undefined);
  }, []);

  const animateSteps = useCallback((stepsLength: number) => {
    setVisibleStepCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleStepCount(count);
      if (count >= stepsLength) clearInterval(interval);
    }, 120);
  }, []);

  const scrollToHighlight = useCallback((suppressed: boolean) => {
    setTimeout(() => {
      const el = suppressed ? receiptRef.current : auctionRef.current;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
  }, []);

  const runPipeline = useCallback(
    async (text: string, kind?: DemoKind) => {
      setLoading(true);
      setError(null);
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
        const data = (await res.json()) as PipelineResult & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Pipeline failed");
        }

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
            detail: `Receipt: ${data.receipt.placementDecision} (${data.durationMs}ms)`,
          };
          if (
            prev.some(
              (e) =>
                e.type === "receipt_opened" &&
                e.impressionId === data.impressionId
            )
          ) {
            return prev;
          }
          return [...prev, opened];
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [animateSteps, forceNoSafeAds, scrollToHighlight, simulateApiFailure]
  );

  const reset = useCallback(() => {
    setPrompt("");
    setResult(null);
    setSafeSnapshot(null);
    setVulnSnapshot(null);
    setVisibleStepCount(0);
    setExtraEvents([]);
    setError(null);
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

  return {
    prompt,
    setPrompt,
    result,
    safeSnapshot,
    vulnSnapshot,
    visibleStepCount,
    loading,
    error,
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
  };
}
