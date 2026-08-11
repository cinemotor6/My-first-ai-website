import type {
  CompanyProfile,
  FinancialStatement,
  HistoricalBar,
  Quote,
} from "@financeapp/shared-types";
import type { MarketDataProvider } from "../../types";
import {
  parseYahooCompanyProfile,
  parseYahooFinancialStatement,
  parseYahooHistoricalBars,
  parseYahooQuote,
  parseYahooSearchResults,
  YahooDataError,
} from "./parse";
import type { YahooChartResponse, YahooQuoteSummaryResponse, YahooSearchResponse } from "./types";

const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const QUOTE_SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const SEARCH_BASE = "https://query1.finance.yahoo.com/v1/finance/search";
const REQUEST_TIMEOUT_MS = 8_000;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; global-finance-app/0.1)" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new YahooDataError(`Yahoo Finance request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Live market data via Yahoo Finance's public, keyless chart/quoteSummary/
 * search endpoints — the same undocumented API the `yfinance` Python
 * library scrapes. No API key, no signup, no cost. It's also unofficial
 * and unsupported: Yahoo can change the response shape or rate-limit
 * without notice, which is why this is never used directly — see
 * `providers/index.ts`, which wraps it with a fallback to mock data.
 */
export class YahooFinanceMarketDataProvider implements MarketDataProvider {
  readonly name = "yahoo";

  async getQuote(symbol: string): Promise<Quote> {
    const json = await fetchJson<YahooChartResponse>(
      `${CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
    );
    return parseYahooQuote(json);
  }

  async getHistoricalBars(symbol: string, days: number): Promise<HistoricalBar[]> {
    const period2 = Math.floor(Date.now() / 1000);
    const period1 = period2 - days * 24 * 60 * 60;
    const json = await fetchJson<YahooChartResponse>(
      `${CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`,
    );
    return parseYahooHistoricalBars(json);
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const json = await fetchJson<YahooQuoteSummaryResponse>(
      `${QUOTE_SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=assetProfile,price`,
    );
    return parseYahooCompanyProfile(json, symbol);
  }

  async getFinancialStatement(symbol: string): Promise<FinancialStatement> {
    const json = await fetchJson<YahooQuoteSummaryResponse>(
      `${QUOTE_SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`,
    );
    return parseYahooFinancialStatement(json, symbol);
  }

  async searchSymbols(query: string): Promise<CompanyProfile[]> {
    const json = await fetchJson<YahooSearchResponse>(
      `${SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
    );
    return parseYahooSearchResults(json);
  }
}
