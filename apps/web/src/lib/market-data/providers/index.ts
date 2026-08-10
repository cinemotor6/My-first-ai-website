import type { MarketDataProvider } from "../types";
import { MockMarketDataProvider } from "./mock-provider";

/**
 * Provider registry. To add a real data source (Finnhub, Twelve Data,
 * Polygon.io, ...): implement `MarketDataProvider` in a new file under
 * `providers/`, register it below, then set MARKET_DATA_PROVIDER in .env.
 * Nothing outside this file needs to change.
 */
const PROVIDERS: Record<string, () => MarketDataProvider> = {
  mock: () => new MockMarketDataProvider(),
};

let cachedProvider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.MARKET_DATA_PROVIDER?.trim() || "mock";
  const factory = PROVIDERS[providerName];

  if (!factory) {
    throw new Error(
      `Unknown MARKET_DATA_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }

  cachedProvider = factory();
  return cachedProvider;
}
