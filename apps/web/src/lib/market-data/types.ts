import type {
  CompanyProfile,
  FinancialStatement,
  HistoricalBar,
  Quote,
} from "@financeapp/shared-types";

/**
 * Every market-data source (mock, or a real provider like Finnhub/Twelve Data
 * later) implements this interface. The rest of the app only ever depends on
 * `MarketDataProvider`, never on a concrete provider, so swapping the data
 * source is a one-line change in `providers/index.ts`.
 */
export interface MarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<Quote>;
  searchSymbols(query: string): Promise<CompanyProfile[]>;
  getCompanyProfile(symbol: string): Promise<CompanyProfile>;
  getHistoricalBars(symbol: string, days: number): Promise<HistoricalBar[]>;
  getFinancialStatement(symbol: string): Promise<FinancialStatement>;
}

export class SymbolNotFoundError extends Error {
  constructor(symbol: string) {
    super(`Unknown symbol: ${symbol}`);
    this.name = "SymbolNotFoundError";
  }
}
