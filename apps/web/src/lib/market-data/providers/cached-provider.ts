import type {
  CompanyProfile,
  FinancialStatement,
  HistoricalBar,
  Quote,
} from "@financeapp/shared-types";
import type { MarketDataProvider } from "../types";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * TTLs are deliberately different per method: a quote goes stale in
 * seconds, but a company profile or financial statement barely changes
 * within a session. Values are milliseconds.
 */
export const CACHE_TTL_MS = {
  quote: 15_000,
  historicalBars: 5 * 60_000,
  companyProfile: 15 * 60_000,
  financialStatement: 60 * 60_000,
  search: 30_000,
} as const;

/**
 * Wraps a `MarketDataProvider` with a short-lived in-memory cache, keyed
 * per method + arguments. Without this, requesting the same symbol from
 * two different pages within the same few seconds — e.g. AAPL showing on
 * both Overview and Markets, or a stock detail page re-rendering after a
 * client navigation — is an independent live request each time, which
 * needlessly increases rate-limit risk against Yahoo Finance's free,
 * unofficial, keyless API. Only successful results are cached: a failure
 * is never stored, so the wrapped provider (and its own error) is retried
 * on every call until it succeeds, and the fallback layer above this still
 * sees a fresh failure to react to.
 */
export class CachedMarketDataProvider implements MarketDataProvider {
  readonly name: string;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly inner: MarketDataProvider,
    private readonly now: () => number = Date.now,
  ) {
    this.name = `${inner.name} (cached)`;
  }

  private async withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const nowMs = this.now();
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > nowMs) {
      return entry.value as T;
    }

    const value = await fn();
    this.cache.set(key, { value, expiresAt: nowMs + ttlMs });
    return value;
  }

  getQuote(symbol: string): Promise<Quote> {
    return this.withCache(`quote:${symbol.toUpperCase()}`, CACHE_TTL_MS.quote, () =>
      this.inner.getQuote(symbol),
    );
  }

  getHistoricalBars(symbol: string, days: number): Promise<HistoricalBar[]> {
    return this.withCache(
      `bars:${symbol.toUpperCase()}:${days}`,
      CACHE_TTL_MS.historicalBars,
      () => this.inner.getHistoricalBars(symbol, days),
    );
  }

  getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return this.withCache(
      `profile:${symbol.toUpperCase()}`,
      CACHE_TTL_MS.companyProfile,
      () => this.inner.getCompanyProfile(symbol),
    );
  }

  getFinancialStatement(symbol: string): Promise<FinancialStatement> {
    return this.withCache(
      `financials:${symbol.toUpperCase()}`,
      CACHE_TTL_MS.financialStatement,
      () => this.inner.getFinancialStatement(symbol),
    );
  }

  searchSymbols(query: string): Promise<CompanyProfile[]> {
    return this.withCache(`search:${query.trim().toLowerCase()}`, CACHE_TTL_MS.search, () =>
      this.inner.searchSymbols(query),
    );
  }
}
