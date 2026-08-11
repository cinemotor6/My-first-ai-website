import type {
  CompanyProfile,
  FinancialStatement,
  FinancialStatementLine,
  HistoricalBar,
  NewsArticle,
  Quote,
} from "@financeapp/shared-types";
import type {
  YahooChartResponse,
  YahooQuoteSummaryResponse,
  YahooSearchResponse,
} from "./types";

export class YahooDataError extends Error {}

export function parseYahooQuote(json: YahooChartResponse): Quote {
  const result = json.chart.result?.[0];
  if (!result) {
    throw new YahooDataError(json.chart.error?.description || "No chart result in response.");
  }
  const { meta } = result;
  const previousClose = meta.previousClose ?? meta.chartPreviousClose;
  if (previousClose === undefined) {
    throw new YahooDataError("Chart response is missing previousClose.");
  }

  const price = meta.regularMarketPrice;
  const change = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol: meta.symbol,
    exchange: meta.fullExchangeName || meta.exchangeName,
    currency: meta.currency,
    price: round2(price),
    change: round2(change),
    changePercent: round2(changePercent),
    previousClose: round2(previousClose),
    dayHigh: round2(meta.regularMarketDayHigh ?? price),
    dayLow: round2(meta.regularMarketDayLow ?? price),
    volume: meta.regularMarketVolume ?? 0,
    asOf: new Date().toISOString(),
  };
}

export function parseYahooHistoricalBars(json: YahooChartResponse): HistoricalBar[] {
  const result = json.chart.result?.[0];
  if (!result) {
    throw new YahooDataError(json.chart.error?.description || "No chart result in response.");
  }
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators.quote[0];

  const bars: HistoricalBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    const volume = quote.volume?.[i];
    // Yahoo returns null entries for non-trading gaps in the series.
    if (open == null || high == null || low == null || close == null) continue;

    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: volume ?? 0,
    });
  }
  return bars;
}

export function parseYahooCompanyProfile(
  json: YahooQuoteSummaryResponse,
  symbol: string,
): CompanyProfile {
  const result = json.quoteSummary.result[0];
  if (!result) {
    throw new YahooDataError(json.quoteSummary.error?.description || "No profile data in response.");
  }
  const { assetProfile, price } = result;

  return {
    symbol: price?.symbol || symbol,
    name: price?.longName || price?.shortName || symbol,
    exchange: price?.exchangeName || "Unknown",
    country: assetProfile?.country || "Unknown",
    sector: assetProfile?.sector || "Unknown",
    industry: assetProfile?.industry || "Unknown",
    currency: price?.currency || "USD",
    description: assetProfile?.longBusinessSummary || "",
    website: assetProfile?.website,
  };
}

export function parseYahooFinancialStatement(
  json: YahooQuoteSummaryResponse,
  symbol: string,
): FinancialStatement {
  const result = json.quoteSummary.result[0];
  if (!result) {
    throw new YahooDataError(json.quoteSummary.error?.description || "No financial data in response.");
  }

  const income = result.incomeStatementHistory?.incomeStatementHistory?.[0];
  const balance = result.balanceSheetHistory?.balanceSheetStatements?.[0];
  const cashFlow = result.cashflowStatementHistory?.cashflowStatements?.[0];

  if (!income) {
    throw new YahooDataError("No income statement history in response.");
  }

  const incomeStatement: FinancialStatementLine[] = [
    { label: "Revenue", value: income.totalRevenue?.raw ?? 0 },
    { label: "Cost of Revenue", value: income.costOfRevenue?.raw ?? 0 },
    { label: "Gross Profit", value: income.grossProfit?.raw ?? 0 },
    { label: "Operating Expenses", value: income.totalOperatingExpenses?.raw ?? 0 },
    { label: "Operating Income", value: income.operatingIncome?.raw ?? 0 },
    { label: "Net Income", value: income.netIncome?.raw ?? 0 },
  ];

  const balanceSheet: FinancialStatementLine[] = balance
    ? [
        { label: "Total Assets", value: balance.totalAssets?.raw ?? 0 },
        { label: "Total Liabilities", value: balance.totalLiab?.raw ?? 0 },
        { label: "Total Equity", value: balance.totalStockholderEquity?.raw ?? 0 },
      ]
    : [];

  const cashFlowLines: FinancialStatementLine[] = cashFlow
    ? [
        {
          label: "Operating Cash Flow",
          value: cashFlow.totalCashFromOperatingActivities?.raw ?? 0,
        },
        { label: "Capital Expenditures", value: cashFlow.capitalExpenditures?.raw ?? 0 },
        {
          label: "Free Cash Flow",
          value:
            (cashFlow.totalCashFromOperatingActivities?.raw ?? 0) +
            (cashFlow.capitalExpenditures?.raw ?? 0),
        },
      ]
    : [];

  return {
    symbol,
    period: "annual",
    fiscalYear: new Date(income.endDate.raw * 1000).getUTCFullYear(),
    currency: "USD",
    incomeStatement,
    balanceSheet,
    cashFlow: cashFlowLines,
  };
}

export function parseYahooSearchResults(json: YahooSearchResponse): CompanyProfile[] {
  const quotes = json.quotes ?? [];
  return quotes
    .filter((q) => q.symbol && (q.shortname || q.longname))
    .map((q) => ({
      symbol: q.symbol,
      name: q.longname || q.shortname || q.symbol,
      exchange: q.exchDisp || q.exchange || "Unknown",
      country: "Unknown",
      sector: q.sector || "Unknown",
      industry: q.industry || "Unknown",
      currency: "USD",
      description: "",
    }));
}

export function parseYahooNews(json: YahooSearchResponse, fallbackSymbol?: string): NewsArticle[] {
  const news = json.news ?? [];
  return news
    .filter((n) => n.title && n.link)
    .map((n) => ({
      id: n.uuid,
      headline: n.title,
      source: n.publisher,
      url: n.link,
      publishedAt: new Date(n.providerPublishTime * 1000).toISOString(),
      relatedSymbols: n.relatedTickers?.length ? n.relatedTickers : fallbackSymbol ? [fallbackSymbol] : [],
    }));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
