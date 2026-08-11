import { describe, expect, it, vi } from "vitest";
import { FallbackMarketDataProvider } from "./fallback-provider";
import type { MarketDataProvider } from "../types";
import type { Quote } from "@financeapp/shared-types";

const LIVE_QUOTE: Quote = {
  symbol: "AAPL",
  exchange: "NasdaqGS",
  currency: "USD",
  price: 227.5,
  change: 1.2,
  changePercent: 0.5,
  previousClose: 226.3,
  dayHigh: 228,
  dayLow: 225,
  volume: 1000,
  asOf: "2026-01-01T00:00:00.000Z",
};

const MOCK_QUOTE: Quote = { ...LIVE_QUOTE, price: 200 };

function makeProvider(overrides: Partial<MarketDataProvider> = {}): MarketDataProvider {
  return {
    name: "stub",
    getQuote: vi.fn().mockResolvedValue(LIVE_QUOTE),
    getHistoricalBars: vi.fn().mockResolvedValue([]),
    getCompanyProfile: vi.fn().mockResolvedValue({}),
    getFinancialStatement: vi.fn().mockResolvedValue({}),
    searchSymbols: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("FallbackMarketDataProvider", () => {
  it("returns the primary's result when the primary succeeds", async () => {
    const primary = makeProvider({ name: "live", getQuote: vi.fn().mockResolvedValue(LIVE_QUOTE) });
    const fallback = makeProvider({ name: "mock", getQuote: vi.fn().mockResolvedValue(MOCK_QUOTE) });
    const provider = new FallbackMarketDataProvider(primary, fallback);

    const quote = await provider.getQuote("AAPL");

    expect(quote).toEqual(LIVE_QUOTE);
    expect(primary.getQuote).toHaveBeenCalledWith("AAPL");
    expect(fallback.getQuote).not.toHaveBeenCalled();
  });

  it("falls back to the mock provider when the primary throws", async () => {
    const primary = makeProvider({
      name: "live",
      getQuote: vi.fn().mockRejectedValue(new Error("network down")),
    });
    const fallback = makeProvider({ name: "mock", getQuote: vi.fn().mockResolvedValue(MOCK_QUOTE) });
    const provider = new FallbackMarketDataProvider(primary, fallback);

    const quote = await provider.getQuote("AAPL");

    expect(quote).toEqual(MOCK_QUOTE);
    expect(fallback.getQuote).toHaveBeenCalledWith("AAPL");
  });

  it("falls back independently per method", async () => {
    const primary = makeProvider({
      name: "live",
      getQuote: vi.fn().mockResolvedValue(LIVE_QUOTE),
      searchSymbols: vi.fn().mockRejectedValue(new Error("search down")),
    });
    const fallback = makeProvider({
      name: "mock",
      searchSymbols: vi.fn().mockResolvedValue([{ symbol: "AAPL" }] as never),
    });
    const provider = new FallbackMarketDataProvider(primary, fallback);

    const quote = await provider.getQuote("AAPL");
    const results = await provider.searchSymbols("apple");

    expect(quote).toEqual(LIVE_QUOTE); // primary succeeded, no fallback needed
    expect(results).toEqual([{ symbol: "AAPL" }]); // primary failed, fell back
  });

  it("propagates the fallback's error if both primary and fallback fail", async () => {
    const primary = makeProvider({ getQuote: vi.fn().mockRejectedValue(new Error("live down")) });
    const fallback = makeProvider({ getQuote: vi.fn().mockRejectedValue(new Error("mock broken too")) });
    const provider = new FallbackMarketDataProvider(primary, fallback);

    await expect(provider.getQuote("AAPL")).rejects.toThrow("mock broken too");
  });
});
