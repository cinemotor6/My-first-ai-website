import { describe, expect, it } from "vitest";
import { MockMarketDataProvider } from "./mock-provider";
import { SymbolNotFoundError } from "../types";

describe("MockMarketDataProvider", () => {
  const provider = new MockMarketDataProvider();

  it("resolves quotes for known companies", async () => {
    const quote = await provider.getQuote("AAPL");
    expect(quote.symbol).toBe("AAPL");
    expect(quote.price).toBeGreaterThan(0);
  });

  it("resolves quotes for known indices", async () => {
    const quote = await provider.getQuote("^GSPC");
    expect(quote.symbol).toBe("^GSPC");
    expect(quote.price).toBeGreaterThan(0);
  });

  it("throws SymbolNotFoundError for unknown symbols", async () => {
    await expect(provider.getQuote("NOPE")).rejects.toThrow(SymbolNotFoundError);
  });

  it("marks index profiles with sector 'Index'", async () => {
    const profile = await provider.getCompanyProfile("^DJI");
    expect(profile.sector).toBe("Index");
  });

  it("search includes both companies and indices matching the query", async () => {
    const results = await provider.searchSymbols("s&p");
    expect(results.some((r) => r.symbol === "^GSPC")).toBe(true);
  });

  it("search is case-insensitive and matches by name or symbol", async () => {
    const bySymbol = await provider.searchSymbols("aapl");
    const byName = await provider.searchSymbols("apple");
    expect(bySymbol.map((r) => r.symbol)).toContain("AAPL");
    expect(byName.map((r) => r.symbol)).toContain("AAPL");
  });

  it("returns historical bars covering the requested window", async () => {
    const bars = await provider.getHistoricalBars("AAPL", 30);
    expect(bars.length).toBe(31); // inclusive of both endpoints
    expect(bars[0].date < bars[bars.length - 1].date).toBe(true);
  });
});
