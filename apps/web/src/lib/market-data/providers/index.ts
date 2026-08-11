import type { MarketDataProvider } from "../types";
import { MockMarketDataProvider } from "./mock-provider";
import { YahooFinanceMarketDataProvider } from "./yahoo/provider";
import { FallbackMarketDataProvider } from "./fallback-provider";

/**
 * Provider registry. To add another real data source: implement
 * `MarketDataProvider` in a new file under `providers/`, register it
 * below, then set MARKET_DATA_PROVIDER in .env. Nothing outside this file
 * needs to change.
 */
const PROVIDERS: Record<string, () => MarketDataProvider> = {
  mock: () => new MockMarketDataProvider(),
  yahoo: () => new YahooFinanceMarketDataProvider(),
  // Default: try live Yahoo Finance data, transparently fall back to mock
  // on any failure (network down, rate limited, unexpected response shape,
  // unknown symbol). No API key required either way.
  live: () =>
    new FallbackMarketDataProvider(new YahooFinanceMarketDataProvider(), new MockMarketDataProvider()),
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
