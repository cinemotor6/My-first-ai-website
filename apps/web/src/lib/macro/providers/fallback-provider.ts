import type { MacroIndicator } from "@financeapp/shared-types";
import type { MacroProvider } from "../types";
import { withFallback } from "@/lib/provider-fallback";

/** Tries `primary` first; on any failure, transparently falls back to `fallback`. */
export class FallbackMacroProvider implements MacroProvider {
  readonly name: string;

  constructor(
    private readonly primary: MacroProvider,
    private readonly fallback: MacroProvider,
  ) {
    this.name = `${primary.name} (fallback: ${fallback.name})`;
  }

  getIndicators(region?: string): Promise<MacroIndicator[]> {
    return withFallback(
      `macro.getIndicators(${region ?? "all"})`,
      () => this.primary.getIndicators(region),
      () => this.fallback.getIndicators(region),
    );
  }
}
