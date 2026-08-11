import { describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS, CachedMarketDataProvider } from "./cached-provider";
import type { MarketDataProvider } from "../types";
import type { Quote } from "@financeapp/shared-types";

const QUOTE: Quote = {
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

function makeProvider(overrides: Partial<MarketDataProvider> = {}): MarketDataProvider {
  return {
    name: "stub",
    getQuote: vi.fn().mockResolvedValue(QUOTE),
    getHistoricalBars: vi.fn().mockResolvedValue([]),
    getCompanyProfile: vi.fn().mockResolvedValue({}),
    getFinancialStatement: vi.fn().mockResolvedValue({}),
    searchSymbols: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

/** A controllable clock so TTL expiry can be tested without real waits. */
function makeClock(startMs = 0) {
  let current = startMs;
  return { now: () => current, advance: (ms: number) => (current += ms) };
}

describe("CachedMarketDataProvider", () => {
  it("returns the inner provider's result on the first call", async () => {
    const inner = makeProvider();
    const provider = new CachedMarketDataProvider(inner);

    const quote = await provider.getQuote("AAPL");

    expect(quote).toEqual(QUOTE);
    expect(inner.getQuote).toHaveBeenCalledTimes(1);
  });

  it("serves a repeat call within the TTL from cache, without calling the inner provider again", async () => {
    const inner = makeProvider();
    const clock = makeClock();
    const provider = new CachedMarketDataProvider(inner, clock.now);

    await provider.getQuote("AAPL");
    clock.advance(CACHE_TTL_MS.quote - 1);
    const second = await provider.getQuote("AAPL");

    expect(second).toEqual(QUOTE);
    expect(inner.getQuote).toHaveBeenCalledTimes(1);
  });

  it("re-fetches once the TTL has expired", async () => {
    const inner = makeProvider();
    const clock = makeClock();
    const provider = new CachedMarketDataProvider(inner, clock.now);

    await provider.getQuote("AAPL");
    clock.advance(CACHE_TTL_MS.quote + 1);
    await provider.getQuote("AAPL");

    expect(inner.getQuote).toHaveBeenCalledTimes(2);
  });

  it("caches different symbols independently", async () => {
    const inner = makeProvider();
    const provider = new CachedMarketDataProvider(inner);

    await provider.getQuote("AAPL");
    await provider.getQuote("MSFT");
    await provider.getQuote("AAPL");

    expect(inner.getQuote).toHaveBeenCalledTimes(2);
  });

  it("caches symbols case-insensitively", async () => {
    const inner = makeProvider();
    const provider = new CachedMarketDataProvider(inner);

    await provider.getQuote("aapl");
    await provider.getQuote("AAPL");

    expect(inner.getQuote).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failed call — the next call retries the inner provider", async () => {
    const inner = makeProvider({
      getQuote: vi.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValue(QUOTE),
    });
    const provider = new CachedMarketDataProvider(inner);

    await expect(provider.getQuote("AAPL")).rejects.toThrow("network down");
    const quote = await provider.getQuote("AAPL");

    expect(quote).toEqual(QUOTE);
    expect(inner.getQuote).toHaveBeenCalledTimes(2);
  });

  it("caches getHistoricalBars independently per days argument", async () => {
    const inner = makeProvider();
    const provider = new CachedMarketDataProvider(inner);

    await provider.getHistoricalBars("AAPL", 30);
    await provider.getHistoricalBars("AAPL", 90);
    await provider.getHistoricalBars("AAPL", 30);

    expect(inner.getHistoricalBars).toHaveBeenCalledTimes(2);
  });

  it("caches searchSymbols per query, trimmed and case-insensitive", async () => {
    const inner = makeProvider();
    const provider = new CachedMarketDataProvider(inner);

    await provider.searchSymbols("Apple");
    await provider.searchSymbols(" apple ");

    expect(inner.searchSymbols).toHaveBeenCalledTimes(1);
  });

  it("exposes a name that reflects the wrapped provider", () => {
    const inner = makeProvider({ name: "yahoo" });
    const provider = new CachedMarketDataProvider(inner);

    expect(provider.name).toBe("yahoo (cached)");
  });
});
