/**
 * Shared types used by both the Next.js app (apps/web) and, conceptually,
 * mirrored by the Pydantic schemas in the Python quant service (apps/quant-api).
 * Keeping these in one place is what lets the market-data layer, valuation
 * engine, and UI evolve independently without drifting apart.
 */

// ---- Market data -----------------------------------------------------

export type Currency = string; // ISO 4217, e.g. "USD", "EUR", "JPY"

export interface Quote {
  symbol: string;
  exchange: string;
  currency: Currency;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  asOf: string; // ISO timestamp
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  industry: string;
  currency: Currency;
  description: string;
  website?: string;
}

export interface HistoricalBar {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinancialStatementLine {
  label: string;
  value: number;
}

export interface FinancialStatement {
  symbol: string;
  period: "annual" | "quarterly";
  fiscalYear: number;
  currency: Currency;
  incomeStatement: FinancialStatementLine[];
  balanceSheet: FinancialStatementLine[];
  cashFlow: FinancialStatementLine[];
}

// ---- Portfolio ---------------------------------------------------------

export interface PortfolioHolding {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currency: Currency;
}

// ---- Watchlist -----------------------------------------------------------

export interface WatchlistItem {
  id: string;
  symbol: string;
}

// ---- News & macro --------------------------------------------------------

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  relatedSymbols: string[];
}

export interface MacroIndicator {
  id: string;
  name: string;
  region: string;
  value: number;
  unit: string;
  period: string;
  previousValue?: number;
}

// ---- Valuation (mirrors apps/quant-api/app/schemas.py) -------------------

export interface DCFInput {
  symbol: string;
  currentRevenue: number;
  revenueGrowthRate: number; // decimal, e.g. 0.08 for 8%
  ebitMargin: number; // decimal
  taxRate: number; // decimal
  discountRate: number; // WACC, decimal
  terminalGrowthRate: number; // decimal
  projectionYears: number;
  sharesOutstanding: number;
  netDebt: number;
}

export interface DCFResult {
  symbol: string;
  enterpriseValue: number;
  equityValue: number;
  fairValuePerShare: number;
  projectedFreeCashFlows: number[];
  terminalValue: number;
  presentValueOfCashFlows: number;
  presentValueOfTerminalValue: number;
}

export interface MonteCarloInput {
  symbol: string;
  baseCase: DCFInput;
  iterations: number;
  revenueGrowthStdDev: number;
  discountRateStdDev: number;
}

export interface ScenarioInput {
  symbol: string;
  baseCase: DCFInput;
  scenarios: {
    name: string;
    overrides: Partial<DCFInput>;
  }[];
}

export interface HistogramBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

export interface MonteCarloResult {
  symbol: string;
  iterations: number;
  meanFairValue: number;
  medianFairValue: number;
  stdDev: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  minValue: number;
  maxValue: number;
  histogram: HistogramBucket[];
}

export interface ScenarioResult {
  name: string;
  result: DCFResult | null;
  error: string | null;
}

export interface ScenarioAnalysisResult {
  symbol: string;
  baseCase: DCFResult;
  scenarios: ScenarioResult[];
}
