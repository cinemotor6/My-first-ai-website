import type { MacroIndicator } from "@financeapp/shared-types";
import type { MacroProvider } from "../../types";
import { parseWorldBankIndicator, WorldBankDataError } from "./parse";
import type { WorldBankResponse } from "./types";

const BASE_URL = "https://api.worldbank.org/v2/country";
const REQUEST_TIMEOUT_MS = 8_000;

const REGIONS: { region: string; countryCode: string }[] = [
  { region: "United States", countryCode: "US" },
  { region: "Euro Area", countryCode: "EMU" },
  { region: "Japan", countryCode: "JP" },
  { region: "China", countryCode: "CN" },
];

// World Bank only has annual macro aggregates on its free API — no policy
// rates, no monthly CPI. GDP growth and inflation are what's actually
// available keylessly; scoped to that rather than promising indicators
// this source can't provide.
const INDICATORS: { id: string; code: string; name: string; unit: string }[] = [
  { id: "gdp-growth", code: "NY.GDP.MKTP.KD.ZG", name: "GDP Growth (annual %)", unit: "%" },
  { id: "cpi", code: "FP.CPI.TOTL.ZG", name: "CPI Inflation (annual %)", unit: "%" },
];

async function fetchIndicator(countryCode: string, indicatorCode: string): Promise<WorldBankResponse> {
  const res = await fetch(
    `${BASE_URL}/${countryCode}/indicator/${indicatorCode}?format=json&mrv=2`,
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );
  if (!res.ok) {
    throw new WorldBankDataError(`World Bank request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<WorldBankResponse>;
}

/**
 * Live macro indicators via the World Bank's public, keyless API — no
 * signup, no key. Data is annual with a reporting lag (typically 1-2 years
 * behind "today"), unlike the mock provider's illustrative current-month
 * figures; that's an inherent property of this free source, not a bug.
 */
export class WorldBankMacroProvider implements MacroProvider {
  readonly name = "worldbank";

  async getIndicators(region?: string): Promise<MacroIndicator[]> {
    const regions = region
      ? REGIONS.filter((r) => r.region.toLowerCase() === region.toLowerCase())
      : REGIONS;

    if (regions.length === 0) return [];

    const settled = await Promise.allSettled(
      regions.flatMap((r) =>
        INDICATORS.map(async (ind) => {
          const json = await fetchIndicator(r.countryCode, ind.code);
          return parseWorldBankIndicator(json, {
            id: `${r.countryCode.toLowerCase()}-${ind.id}`,
            name: ind.name,
            region: r.region,
            unit: ind.unit,
          });
        }),
      ),
    );

    const results = settled
      .filter((s): s is PromiseFulfilledResult<MacroIndicator> => s.status === "fulfilled")
      .map((s) => s.value);

    // If literally nothing came back, treat this as a failure so the
    // fallback wrapper substitutes full mock data instead of an empty
    // macro page. A partial result (some indicators failed, others
    // didn't) is returned as-is — some real data beats none.
    if (results.length === 0) {
      throw new WorldBankDataError("No World Bank indicators could be fetched.");
    }

    return results;
  }
}
