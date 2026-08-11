/**
 * Minimal shapes for the fields we actually read from Yahoo Finance's
 * public (unofficial, undocumented, keyless) endpoints. These are not
 * official/stable contracts — Yahoo can change them without notice, which
 * is exactly why every call through this provider is wrapped in a
 * fallback to mock data (see providers/index.ts).
 */

export interface YahooChartMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  fullExchangeName?: string;
  regularMarketPrice: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  longName?: string;
  shortName?: string;
}

export interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators: {
    quote: [
      {
        open?: (number | null)[];
        high?: (number | null)[];
        low?: (number | null)[];
        close?: (number | null)[];
        volume?: (number | null)[];
      },
    ];
  };
}

export interface YahooChartResponse {
  chart: {
    result: [YahooChartResult] | null;
    error: { code: string; description: string } | null;
  };
}

interface YahooRawValue {
  raw: number;
  fmt?: string;
}

export interface YahooQuoteSummaryResponse {
  quoteSummary: {
    result:
      | [
          {
            assetProfile?: {
              sector?: string;
              industry?: string;
              longBusinessSummary?: string;
              country?: string;
              website?: string;
            };
            price?: {
              longName?: string;
              shortName?: string;
              exchangeName?: string;
              currency?: string;
              symbol?: string;
            };
            incomeStatementHistory?: {
              incomeStatementHistory: {
                endDate: YahooRawValue;
                totalRevenue?: YahooRawValue;
                costOfRevenue?: YahooRawValue;
                grossProfit?: YahooRawValue;
                totalOperatingExpenses?: YahooRawValue;
                operatingIncome?: YahooRawValue;
                netIncome?: YahooRawValue;
              }[];
            };
            balanceSheetHistory?: {
              balanceSheetStatements: {
                endDate: YahooRawValue;
                totalAssets?: YahooRawValue;
                totalLiab?: YahooRawValue;
                totalStockholderEquity?: YahooRawValue;
              }[];
            };
            cashflowStatementHistory?: {
              cashflowStatements: {
                endDate: YahooRawValue;
                totalCashFromOperatingActivities?: YahooRawValue;
                capitalExpenditures?: YahooRawValue;
              }[];
            };
          },
        ]
      | [];
    error: { code: string; description: string } | null;
  };
}

export interface YahooSearchResponse {
  quotes?: {
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    exchDisp?: string;
    quoteType?: string;
    sector?: string;
    industry?: string;
  }[];
  news?: {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: number;
    relatedTickers?: string[];
  }[];
}
