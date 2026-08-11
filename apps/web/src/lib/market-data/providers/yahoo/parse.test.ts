import { describe, expect, it } from "vitest";
import {
  parseYahooCompanyProfile,
  parseYahooFinancialStatement,
  parseYahooHistoricalBars,
  parseYahooNews,
  parseYahooQuote,
  parseYahooSearchResults,
  YahooDataError,
} from "./parse";
import type {
  YahooChartMeta,
  YahooChartResponse,
  YahooQuoteSummaryResponse,
  YahooSearchResponse,
} from "./types";

function makeChartResponse(overrides: Partial<YahooChartMeta> = {}): YahooChartResponse {
  return {
    chart: {
      result: [
        {
          meta: {
            currency: "USD",
            symbol: "AAPL",
            exchangeName: "NMS",
            fullExchangeName: "NasdaqGS",
            regularMarketPrice: 227.5,
            previousClose: 225.0,
            regularMarketDayHigh: 228.9,
            regularMarketDayLow: 226.1,
            regularMarketVolume: 45_000_000,
            longName: "Apple Inc.",
            ...overrides,
          },
          timestamp: [1_700_000_000, 1_700_086_400, 1_700_172_800],
          indicators: {
            quote: [
              {
                open: [224.0, 225.5, null],
                high: [226.0, 227.0, 229.0],
                low: [223.0, 224.5, 225.0],
                close: [225.0, 226.8, 227.5],
                volume: [40_000_000, 42_000_000, 45_000_000],
              },
            ],
          },
        },
      ],
      error: null,
    },
  };
}

describe("parseYahooQuote", () => {
  it("computes change and changePercent from price vs. previousClose", () => {
    const quote = parseYahooQuote(makeChartResponse());
    expect(quote.symbol).toBe("AAPL");
    expect(quote.price).toBe(227.5);
    expect(quote.previousClose).toBe(225.0);
    expect(quote.change).toBeCloseTo(2.5, 5);
    // Rounded to 2 decimal places, same convention as the mock provider.
    expect(quote.changePercent).toBeCloseTo(1.11, 2);
  });

  it("prefers fullExchangeName over exchangeName", () => {
    const quote = parseYahooQuote(makeChartResponse());
    expect(quote.exchange).toBe("NasdaqGS");
  });

  it("falls back to chartPreviousClose when previousClose is absent", () => {
    const response = makeChartResponse({ previousClose: undefined, chartPreviousClose: 220.0 } as never);
    const quote = parseYahooQuote(response);
    expect(quote.previousClose).toBe(220.0);
  });

  it("throws YahooDataError when the response has no result", () => {
    const response: YahooChartResponse = {
      chart: { result: null, error: { code: "Not Found", description: "No data found" } },
    };
    expect(() => parseYahooQuote(response)).toThrow(YahooDataError);
  });

  it("throws YahooDataError when both previousClose fields are missing", () => {
    const response = makeChartResponse({ previousClose: undefined, chartPreviousClose: undefined } as never);
    expect(() => parseYahooQuote(response)).toThrow(YahooDataError);
  });
});

describe("parseYahooHistoricalBars", () => {
  it("parses each timestamp/quote entry into a bar", () => {
    const bars = parseYahooHistoricalBars(makeChartResponse());
    // Third entry has open: null and should be skipped.
    expect(bars).toHaveLength(2);
    expect(bars[0].close).toBe(225.0);
    expect(bars[1].close).toBe(226.8);
  });

  it("skips entries with null OHLC values (non-trading gaps)", () => {
    const bars = parseYahooHistoricalBars(makeChartResponse());
    expect(bars.every((b) => typeof b.open === "number")).toBe(true);
  });

  it("throws YahooDataError when there's no result", () => {
    const response: YahooChartResponse = {
      chart: { result: null, error: { code: "Not Found", description: "nope" } },
    };
    expect(() => parseYahooHistoricalBars(response)).toThrow(YahooDataError);
  });
});

describe("parseYahooCompanyProfile", () => {
  const response: YahooQuoteSummaryResponse = {
    quoteSummary: {
      result: [
        {
          assetProfile: {
            sector: "Technology",
            industry: "Consumer Electronics",
            longBusinessSummary: "Designs and sells consumer electronics.",
            country: "United States",
            website: "https://www.apple.com",
          },
          price: {
            longName: "Apple Inc.",
            exchangeName: "NasdaqGS",
            currency: "USD",
            symbol: "AAPL",
          },
        },
      ],
      error: null,
    },
  };

  it("maps assetProfile and price fields to CompanyProfile", () => {
    const profile = parseYahooCompanyProfile(response, "AAPL");
    expect(profile).toEqual({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NasdaqGS",
      country: "United States",
      sector: "Technology",
      industry: "Consumer Electronics",
      currency: "USD",
      description: "Designs and sells consumer electronics.",
      website: "https://www.apple.com",
    });
  });

  it("throws YahooDataError when result is empty", () => {
    const empty: YahooQuoteSummaryResponse = {
      quoteSummary: { result: [], error: { code: "Not Found", description: "no profile" } },
    };
    expect(() => parseYahooCompanyProfile(empty, "AAPL")).toThrow(YahooDataError);
  });
});

describe("parseYahooFinancialStatement", () => {
  const response: YahooQuoteSummaryResponse = {
    quoteSummary: {
      result: [
        {
          incomeStatementHistory: {
            incomeStatementHistory: [
              {
                endDate: { raw: 1_727_654_400 }, // 2024-09-30
                totalRevenue: { raw: 391_000_000_000 },
                costOfRevenue: { raw: 210_000_000_000 },
                grossProfit: { raw: 181_000_000_000 },
                totalOperatingExpenses: { raw: 57_000_000_000 },
                operatingIncome: { raw: 124_000_000_000 },
                netIncome: { raw: 93_700_000_000 },
              },
            ],
          },
          balanceSheetHistory: {
            balanceSheetStatements: [
              {
                endDate: { raw: 1_727_654_400 },
                totalAssets: { raw: 364_000_000_000 },
                totalLiab: { raw: 308_000_000_000 },
                totalStockholderEquity: { raw: 56_000_000_000 },
              },
            ],
          },
          cashflowStatementHistory: {
            cashflowStatements: [
              {
                endDate: { raw: 1_727_654_400 },
                totalCashFromOperatingActivities: { raw: 118_000_000_000 },
                capitalExpenditures: { raw: -9_500_000_000 },
              },
            ],
          },
        },
      ],
      error: null,
    },
  };

  it("maps income, balance sheet, and cash flow lines", () => {
    const statement = parseYahooFinancialStatement(response, "AAPL");
    expect(statement.fiscalYear).toBe(2024);
    expect(statement.incomeStatement).toContainEqual({ label: "Revenue", value: 391_000_000_000 });
    expect(statement.balanceSheet).toContainEqual({ label: "Total Assets", value: 364_000_000_000 });
    expect(statement.cashFlow).toContainEqual({
      label: "Free Cash Flow",
      value: 118_000_000_000 + -9_500_000_000,
    });
  });

  it("throws YahooDataError when income statement history is missing", () => {
    const empty: YahooQuoteSummaryResponse = {
      quoteSummary: { result: [{}], error: null },
    };
    expect(() => parseYahooFinancialStatement(empty, "AAPL")).toThrow(YahooDataError);
  });
});

describe("parseYahooSearchResults", () => {
  it("maps quotes with a name to CompanyProfile entries", () => {
    const response: YahooSearchResponse = {
      quotes: [
        { symbol: "AAPL", longname: "Apple Inc.", exchDisp: "NASDAQ" },
        { symbol: "MSFT", shortname: "Microsoft", exchDisp: "NASDAQ" },
        { symbol: "JUNK" }, // no name, should be filtered out
      ],
    };
    const results = parseYahooSearchResults(response);
    expect(results).toHaveLength(2);
    expect(results[0].symbol).toBe("AAPL");
    expect(results[1].name).toBe("Microsoft");
  });

  it("returns an empty array when there are no quotes", () => {
    expect(parseYahooSearchResults({})).toEqual([]);
  });
});

describe("parseYahooNews", () => {
  it("maps news entries with title and link", () => {
    const response: YahooSearchResponse = {
      news: [
        {
          uuid: "abc123",
          title: "Apple announces new product",
          publisher: "Reuters",
          link: "https://example.com/story",
          providerPublishTime: 1_700_000_000,
          relatedTickers: ["AAPL"],
        },
        { uuid: "no-title", title: "", publisher: "X", link: "", providerPublishTime: 0 },
      ],
    };
    const articles = parseYahooNews(response);
    expect(articles).toHaveLength(1);
    expect(articles[0].headline).toBe("Apple announces new product");
    expect(articles[0].relatedSymbols).toEqual(["AAPL"]);
  });

  it("falls back to the queried symbol when relatedTickers is absent", () => {
    const response: YahooSearchResponse = {
      news: [
        {
          uuid: "abc123",
          title: "Some story",
          publisher: "Reuters",
          link: "https://example.com",
          providerPublishTime: 1_700_000_000,
        },
      ],
    };
    const articles = parseYahooNews(response, "AAPL");
    expect(articles[0].relatedSymbols).toEqual(["AAPL"]);
  });
});
