import type {
  CompanyProfile,
  FinancialStatement,
  HistoricalBar,
  Quote,
} from "@financeapp/shared-types";
import type { MarketDataProvider } from "../types";
import { withFallback } from "@/lib/provider-fallback";

/** Tries `primary` first; on any failure, transparently falls back to `fallback`. */
export class FallbackMarketDataProvider implements MarketDataProvider {
  readonly name: string;

  constructor(
    private readonly primary: MarketDataProvider,
    private readonly fallback: MarketDataProvider,
  ) {
    this.name = `${primary.name} (fallback: ${fallback.name})`;
  }

  getQuote(symbol: string): Promise<Quote> {
    return withFallback(
      `market-data.getQuote(${symbol})`,
      () => this.primary.getQuote(symbol),
      () => this.fallback.getQuote(symbol),
    );
  }

  getHistoricalBars(symbol: string, days: number): Promise<HistoricalBar[]> {
    return withFallback(
      `market-data.getHistoricalBars(${symbol})`,
      () => this.primary.getHistoricalBars(symbol, days),
      () => this.fallback.getHistoricalBars(symbol, days),
    );
  }

  getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return withFallback(
      `market-data.getCompanyProfile(${symbol})`,
      () => this.primary.getCompanyProfile(symbol),
      () => this.fallback.getCompanyProfile(symbol),
    );
  }

  getFinancialStatement(symbol: string): Promise<FinancialStatement> {
    return withFallback(
      `market-data.getFinancialStatement(${symbol})`,
      () => this.primary.getFinancialStatement(symbol),
      () => this.fallback.getFinancialStatement(symbol),
    );
  }

  searchSymbols(query: string): Promise<CompanyProfile[]> {
    return withFallback(
      `market-data.searchSymbols(${query})`,
      () => this.primary.searchSymbols(query),
      () => this.fallback.searchSymbols(query),
    );
  }
}
