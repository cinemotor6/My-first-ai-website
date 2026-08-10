import type { NewsArticle } from "@financeapp/shared-types";

export interface NewsProvider {
  readonly name: string;
  getLatest(limit?: number): Promise<NewsArticle[]>;
  getForSymbol(symbol: string, limit?: number): Promise<NewsArticle[]>;
}
