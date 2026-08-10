import type {
  CompanyProfile,
  FinancialStatement,
  HistoricalBar,
  Quote,
} from "@financeapp/shared-types";
import type { MarketDataProvider } from "../types";
import { SymbolNotFoundError } from "../types";

interface MockCompany extends CompanyProfile {
  basePrice: number;
}

/**
 * Small, hand-picked sample of global companies so the UI has something
 * realistic to render without needing an API key. Numbers are illustrative,
 * not live data. Swap MARKET_DATA_PROVIDER to a real adapter when ready.
 */
const MOCK_COMPANIES: MockCompany[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    country: "United States",
    sector: "Technology",
    industry: "Consumer Electronics",
    currency: "USD",
    description: "Designs, manufactures, and markets smartphones, computers, and wearables.",
    website: "https://www.apple.com",
    basePrice: 227.5,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    country: "United States",
    sector: "Technology",
    industry: "Software - Infrastructure",
    currency: "USD",
    description: "Develops, licenses, and supports software, services, devices, and solutions.",
    website: "https://www.microsoft.com",
    basePrice: 415.2,
  },
  {
    symbol: "SAP.DE",
    name: "SAP SE",
    exchange: "XETRA",
    country: "Germany",
    sector: "Technology",
    industry: "Software - Application",
    currency: "EUR",
    description: "Develops enterprise resource planning and cloud software.",
    website: "https://www.sap.com",
    basePrice: 198.4,
  },
  {
    symbol: "7203.T",
    name: "Toyota Motor Corporation",
    exchange: "TSE",
    country: "Japan",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    currency: "JPY",
    description: "Designs, manufactures, and sells passenger vehicles and commercial vehicles.",
    website: "https://global.toyota",
    basePrice: 2850,
  },
  {
    symbol: "0700.HK",
    name: "Tencent Holdings Ltd.",
    exchange: "HKEX",
    country: "China",
    sector: "Communication Services",
    industry: "Internet Content & Information",
    currency: "HKD",
    description: "Provides value-added services, online advertising, and fintech services.",
    website: "https://www.tencent.com",
    basePrice: 385.6,
  },
  {
    symbol: "NESN.SW",
    name: "Nestle S.A.",
    exchange: "SIX",
    country: "Switzerland",
    sector: "Consumer Defensive",
    industry: "Packaged Foods",
    currency: "CHF",
    description: "Manufactures and markets food and beverage products worldwide.",
    website: "https://www.nestle.com",
    basePrice: 88.2,
  },
];

/** Deterministic pseudo-randomness keyed by symbol + day, so mock data is stable across requests within a day. */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

function findCompany(symbol: string): MockCompany {
  const company = MOCK_COMPANIES.find(
    (c) => c.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  if (!company) throw new SymbolNotFoundError(symbol);
  return company;
}

function toProfile(company: MockCompany): CompanyProfile {
  const { symbol, name, exchange, country, sector, industry, currency, description, website } =
    company;
  return { symbol, name, exchange, country, sector, industry, currency, description, website };
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = "mock";

  async getQuote(symbol: string): Promise<Quote> {
    const company = findCompany(symbol);
    const daySeed = new Date().toISOString().slice(0, 10);
    const rand = seededRandom(`${company.symbol}-${daySeed}`);
    const changePercent = (rand - 0.5) * 6; // +/- 3%
    const previousClose = company.basePrice;
    const price = previousClose * (1 + changePercent / 100);
    const change = price - previousClose;

    return {
      symbol: company.symbol,
      exchange: company.exchange,
      currency: company.currency,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      previousClose,
      dayHigh: Number((price * 1.012).toFixed(2)),
      dayLow: Number((price * 0.988).toFixed(2)),
      volume: Math.round(1_000_000 + rand * 20_000_000),
      marketCap: Math.round(price * 1_000_000_000 * (1 + rand)),
      asOf: new Date().toISOString(),
    };
  }

  async searchSymbols(query: string): Promise<CompanyProfile[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_COMPANIES.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    ).map(toProfile);
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return toProfile(findCompany(symbol));
  }

  async getHistoricalBars(symbol: string, days: number): Promise<HistoricalBar[]> {
    const company = findCompany(symbol);
    const bars: HistoricalBar[] = [];
    let price = company.basePrice * 0.85;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const rand = seededRandom(`${company.symbol}-${date.toISOString().slice(0, 10)}`);
      const drift = company.basePrice * 0.0015;
      price = Math.max(price + (rand - 0.48) * drift * 10, price * 0.5);

      const open = price;
      const close = price * (1 + (rand - 0.5) * 0.02);
      const high = Math.max(open, close) * 1.01;
      const low = Math.min(open, close) * 0.99;

      bars.push({
        date: date.toISOString().slice(0, 10),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.round(1_000_000 + rand * 15_000_000),
      });
      price = close;
    }
    return bars;
  }

  async getFinancialStatement(symbol: string): Promise<FinancialStatement> {
    const company = findCompany(symbol);
    const rand = seededRandom(company.symbol);
    const revenue = Math.round(company.basePrice * 400_000_000 * (1 + rand));
    const cogs = Math.round(revenue * 0.55);
    const grossProfit = revenue - cogs;
    const opEx = Math.round(revenue * 0.2);
    const operatingIncome = grossProfit - opEx;
    const netIncome = Math.round(operatingIncome * 0.78);

    return {
      symbol: company.symbol,
      period: "annual",
      fiscalYear: new Date().getFullYear() - 1,
      currency: company.currency,
      incomeStatement: [
        { label: "Revenue", value: revenue },
        { label: "Cost of Revenue", value: cogs },
        { label: "Gross Profit", value: grossProfit },
        { label: "Operating Expenses", value: opEx },
        { label: "Operating Income", value: operatingIncome },
        { label: "Net Income", value: netIncome },
      ],
      balanceSheet: [
        { label: "Total Assets", value: Math.round(revenue * 1.8) },
        { label: "Total Liabilities", value: Math.round(revenue * 0.9) },
        { label: "Total Equity", value: Math.round(revenue * 0.9) },
      ],
      cashFlow: [
        { label: "Operating Cash Flow", value: Math.round(netIncome * 1.2) },
        { label: "Capital Expenditures", value: -Math.round(revenue * 0.06) },
        { label: "Free Cash Flow", value: Math.round(netIncome * 1.2 - revenue * 0.06) },
      ],
    };
  }
}
