import type { FxRateProvider } from "../types";
import { MockFxRateProvider } from "./mock-provider";
import { FrankfurterFxRateProvider } from "./frankfurter/provider";
import { FallbackFxRateProvider } from "./fallback-provider";

const PROVIDERS: Record<string, () => FxRateProvider> = {
  mock: () => new MockFxRateProvider(),
  frankfurter: () => new FrankfurterFxRateProvider(),
  // Default: try live Frankfurter rates, transparently fall back to the
  // static mock rates on any failure (network down, unsupported currency
  // pair, rate limiting). No API key required either way.
  live: () => new FallbackFxRateProvider(new FrankfurterFxRateProvider(), new MockFxRateProvider()),
};

let cached: FxRateProvider | null = null;

export function getFxRateProvider(): FxRateProvider {
  if (cached) return cached;
  const providerName = process.env.FX_RATE_PROVIDER?.trim() || "live";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown FX_RATE_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
