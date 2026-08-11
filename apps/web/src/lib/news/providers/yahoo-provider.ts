import type { NewsArticle } from "@financeapp/shared-types";
import type { NewsProvider } from "../types";
import { parseYahooNews } from "@/lib/market-data/providers/yahoo/parse";
import type { YahooSearchResponse } from "@/lib/market-data/providers/yahoo/types";

const SEARCH_BASE = "https://query1.finance.yahoo.com/v1/finance/search";
const REQUEST_TIMEOUT_MS = 8_000;

async function fetchNews(query: string, limit: number): Promise<NewsArticle[]> {
  const res = await fetch(
    `${SEARCH_BASE}?q=${encodeURIComponent(query)}&newsCount=${limit}&quotesCount=0`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; global-finance-app/0.1)" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  if (!res.ok) {
    throw new Error(`Yahoo Finance news request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as YahooSearchResponse;
  return parseYahooNews(json, query).slice(0, limit);
}

/**
 * Live news via the same keyless Yahoo Finance search endpoint used for
 * symbol search — it returns a `news` array alongside `quotes` when
 * queried. No API key, no signup. Wrapped in a fallback to mock articles
 * for the same reasons as the market-data provider — see providers/index.ts.
 */
export class YahooFinanceNewsProvider implements NewsProvider {
  readonly name = "yahoo";

  async getLatest(limit = 20): Promise<NewsArticle[]> {
    return fetchNews("stock market", limit);
  }

  async getForSymbol(symbol: string, limit = 20): Promise<NewsArticle[]> {
    return fetchNews(symbol, limit);
  }
}
