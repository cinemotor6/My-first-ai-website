import type { NewsProvider } from "../types";
import { MockNewsProvider } from "./mock-provider";
import { YahooFinanceNewsProvider } from "./yahoo-provider";
import { FallbackNewsProvider } from "./fallback-provider";

const PROVIDERS: Record<string, () => NewsProvider> = {
  mock: () => new MockNewsProvider(),
  yahoo: () => new YahooFinanceNewsProvider(),
  // Default: try live Yahoo Finance news, transparently fall back to mock
  // articles on any failure. No API key required either way.
  live: () => new FallbackNewsProvider(new YahooFinanceNewsProvider(), new MockNewsProvider()),
};

let cached: NewsProvider | null = null;

export function getNewsProvider(): NewsProvider {
  if (cached) return cached;
  const providerName = process.env.NEWS_PROVIDER?.trim() || "live";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown NEWS_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
