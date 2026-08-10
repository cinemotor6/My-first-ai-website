import type { NewsProvider } from "../types";
import { MockNewsProvider } from "./mock-provider";

const PROVIDERS: Record<string, () => NewsProvider> = {
  mock: () => new MockNewsProvider(),
};

let cached: NewsProvider | null = null;

export function getNewsProvider(): NewsProvider {
  if (cached) return cached;
  const providerName = process.env.NEWS_PROVIDER?.trim() || "mock";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown NEWS_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
