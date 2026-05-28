import type { PipelineStreamEvent } from "@/lib/pipeline/streamEvents";
import { DEMO_PACE, sleep } from "./demoPace";

export async function delayBeforeEvent(
  event: PipelineStreamEvent,
  paced: boolean
): Promise<void> {
  if (!paced) return;

  switch (event.type) {
    case "status":
      await sleep(DEMO_PACE.msOnStatus);
      break;
    case "step":
      await sleep(DEMO_PACE.msBetweenSteps);
      break;
    case "candidates":
      await sleep(DEMO_PACE.msOnCandidates);
      break;
    case "complete":
      await sleep(DEMO_PACE.msAfterComplete);
      break;
    default:
      break;
  }
}
