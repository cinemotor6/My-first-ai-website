import type { FxRateProvider } from "../types";
import { withFallback } from "@/lib/provider-fallback";

/** Tries `primary` first; on any failure, transparently falls back to `fallback`. */
export class FallbackFxRateProvider implements FxRateProvider {
  readonly name: string;

  constructor(
    private readonly primary: FxRateProvider,
    private readonly fallback: FxRateProvider,
  ) {
    this.name = `${primary.name} (fallback: ${fallback.name})`;
  }

  getRate(from: string, to: string): Promise<number> {
    return withFallback(
      `fx.getRate(${from}->${to})`,
      () => this.primary.getRate(from, to),
      () => this.fallback.getRate(from, to),
    );
  }
}
