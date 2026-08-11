import type { MarketDataProvider } from "../types";
import { MockMarketDataProvider } from "./mock-provider";
import { YahooFinanceMarketDataProvider } from "./yahoo/provider";
import { FallbackMarketDataProvider } from "./fallback-provider";
import { CachedMarketDataProvider } from "./cached-provider";

/**
 * Provider registry. To add another real data source: implement
 * `MarketDataProvider` in a new file under `providers/`, register it
 * below, then set MARKET_DATA_PROVIDER in .env. Nothing outside this file
 * needs to change.
 *
 * The live Yahoo provider is always wrapped in `CachedMarketDataProvider`
 * — a short-lived, per-process, in-memory cache (see cached-provider.ts)
 * that absorbs the duplicate requests that naturally happen when the same
 * symbol shows up on more than one page within a few seconds. It never
 * caches a failure, so the fallback below still reacts to a live outage
 * on every call.
 */
const PROVIDERS: Record<string, () => MarketDataProvider> = {
  mock: () => new MockMarketDataProvider(),
  yahoo: () => new CachedMarketDataProvider(new YahooFinanceMarketDataProvider()),
  // Default: try live Yahoo Finance data (cached), transparently fall back
  // to mock on any failure (network down, rate limited, unexpected
  // response shape, unknown symbol). No API key required either way.
  live: () =>
    new FallbackMarketDataProvider(
      new CachedMarketDataProvider(new YahooFinanceMarketDataProvider()),
      new MockMarketDataProvider(),
    ),
};

let cachedProvider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.MARKET_DATA_PROVIDER?.trim() || "live";
  const factory = PROVIDERS[providerName];

  if (!factory) {
    throw new Error(
      `Unknown MARKET_DATA_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }

  cachedProvider = factory();
  return cachedProvider;
}
