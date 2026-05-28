import { runPipeline } from "@/lib/pipeline/runPipeline";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const result = await runPipeline(prompt, {
      simulateApiFailure: body.simulateApiFailure,
      forceNoSafeAds: body.forceNoSafeAds,
      deterministic: body.deterministic,
      frozen: body.frozen,
      seed: body.seed,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pipeline execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
