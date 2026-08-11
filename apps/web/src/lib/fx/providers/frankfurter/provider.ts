import type { FxRateProvider } from "../../types";
import { parseFrankfurterRate, FrankfurterDataError } from "./parse";
import type { FrankfurterLatestResponse } from "./types";

const BASE_URL = "https://api.frankfurter.dev/v1";
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Live FX rates via Frankfurter (frankfurter.dev) — free, keyless, open
 * source, backed by European Central Bank reference rates. No API key, no
 * signup, no cost. ECB doesn't publish rates on weekends/holidays, and
 * coverage is limited to the currencies ECB tracks, which is why this is
 * wrapped in a fallback to static mock rates — see providers/index.ts.
 */
export class FrankfurterFxRateProvider implements FxRateProvider {
  readonly name = "frankfurter";

  async getRate(from: string, to: string): Promise<number> {
    if (from.toUpperCase() === to.toUpperCase()) return 1;

    const res = await fetch(
      `${BASE_URL}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
    if (!res.ok) {
      throw new FrankfurterDataError(`Frankfurter request failed: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as FrankfurterLatestResponse;
    return parseFrankfurterRate(json, to);
  }
}
