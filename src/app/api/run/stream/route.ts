import { runPipeline } from "@/lib/pipeline/runPipeline";
import type { PipelineStreamEvent } from "@/lib/pipeline/streamEvents";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string;
    simulateApiFailure?: boolean;
    forceNoSafeAds?: boolean;
    deterministic?: boolean;
    frozen?: boolean;
    seed?: string | number;
  };

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PipelineStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await runPipeline(prompt, {
          simulateApiFailure: body.simulateApiFailure,
          forceNoSafeAds: body.forceNoSafeAds,
          deterministic: body.deterministic,
          frozen: body.frozen,
          seed: body.seed,
          onProgress: send,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Pipeline execution failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
