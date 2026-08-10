import type { MacroProvider } from "../types";
import { MockMacroProvider } from "./mock-provider";

const PROVIDERS: Record<string, () => MacroProvider> = {
  mock: () => new MockMacroProvider(),
};

let cached: MacroProvider | null = null;

export function getMacroProvider(): MacroProvider {
  if (cached) return cached;
  const providerName = process.env.MACRO_PROVIDER?.trim() || "mock";
  const factory = PROVIDERS[providerName];
  if (!factory) {
    throw new Error(
      `Unknown MACRO_PROVIDER "${providerName}". Available: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}
