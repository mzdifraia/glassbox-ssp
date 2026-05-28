import { StubAdProvider } from "./StubAdProvider";
import { ThradProvider } from "./ThradProvider";
import type { AdProvider } from "./AdProvider";

export function getAdProvider(): AdProvider {
  if (process.env.THRAD_API_KEY) {
    return new ThradProvider();
  }
  return new StubAdProvider();
}
