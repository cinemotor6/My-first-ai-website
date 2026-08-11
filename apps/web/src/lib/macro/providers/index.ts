import type { MacroProvider } from "../types";
import { MockMacroProvider } from "./mock-provider";
import { WorldBankMacroProvider } from "./worldbank/provider";
import { FallbackMacroProvider } from "./fallback-provider";

const PROVIDERS: Record<string, () => MacroProvider> = {
  mock: () => new MockMacroProvider(),
  worldbank: () => new WorldBankMacroProvider(),
  // Default: try live World Bank data, transparently fall back to mock on
  // any failure (network down, unsupported region, no data returned). No
  // API key required either way.
  live: () => new FallbackMacroProvider(new WorldBankMacroProvider(), new MockMacroProvider()),
};

let cached: MacroProvider | null = null;

export function getMacroProvider(): MacroProvider {
  if (cached) return cached;
  const providerName = process.env.MACRO_PROVIDER?.trim() || "live";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown MACRO_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
