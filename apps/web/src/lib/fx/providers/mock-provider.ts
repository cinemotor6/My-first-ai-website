import type { FxRateProvider } from "../types";

/** Static illustrative rates, quoted as 1 unit of currency -> USD. Not live data. */
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.26,
  JPY: 0.0067,
  CHF: 1.12,
  HKD: 0.128,
  CNY: 0.14,
};

export class MockFxRateProvider implements FxRateProvider {
  readonly name = "mock";

  async getRate(from: string, to: string): Promise<number> {
    const fromRate = USD_RATES[from.toUpperCase()];
    const toRate = USD_RATES[to.toUpperCase()];
    if (fromRate === undefined || toRate === undefined) {
      throw new Error(`No mock FX rate for ${from} -> ${to}`);
    }
    return fromRate / toRate;
  }
}
