import type { NewsArticle } from "@financeapp/shared-types";
import type { NewsProvider } from "../types";

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    headline: "Global markets steady as investors weigh central bank signals",
    source: "Sample Wire",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    relatedSymbols: ["AAPL", "MSFT"],
  },
  {
    id: "2",
    headline: "European tech stocks rally on strong enterprise software demand",
    source: "Sample Wire",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    relatedSymbols: ["SAP.DE"],
  },
  {
    id: "3",
    headline: "Asian automakers navigate supply chain shifts amid EV transition",
    source: "Sample Wire",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    relatedSymbols: ["7203.T"],
  },
  {
    id: "4",
    headline: "Consumer staples seen as defensive play amid rate uncertainty",
    source: "Sample Wire",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    relatedSymbols: ["NESN.SW"],
  },
];

export class MockNewsProvider implements NewsProvider {
  readonly name = "mock";

  async getLatest(limit = 20): Promise<NewsArticle[]> {
    return MOCK_ARTICLES.slice(0, limit);
  }

  async getForSymbol(symbol: string, limit = 20): Promise<NewsArticle[]> {
    return MOCK_ARTICLES.filter((a) =>
      a.relatedSymbols.some((s) => s.toUpperCase() === symbol.toUpperCase()),
    ).slice(0, limit);
  }
}
