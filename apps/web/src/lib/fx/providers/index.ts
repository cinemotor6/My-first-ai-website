import type { FxRateProvider } from "../types";
import { MockFxRateProvider } from "./mock-provider";

const PROVIDERS: Record<string, () => FxRateProvider> = {
  mock: () => new MockFxRateProvider(),
};

let cached: FxRateProvider | null = null;

export function getFxRateProvider(): FxRateProvider {
  if (cached) return cached;
  const providerName = process.env.FX_RATE_PROVIDER?.trim() || "mock";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown FX_RATE_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
