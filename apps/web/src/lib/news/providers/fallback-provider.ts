import type { NewsArticle } from "@financeapp/shared-types";
import type { NewsProvider } from "../types";
import { withFallback } from "@/lib/provider-fallback";

/** Tries `primary` first; on any failure, transparently falls back to `fallback`. */
export class FallbackNewsProvider implements NewsProvider {
  readonly name: string;

  constructor(
    private readonly primary: NewsProvider,
    private readonly fallback: NewsProvider,
  ) {
    this.name = `${primary.name} (fallback: ${fallback.name})`;
  }

  getLatest(limit?: number): Promise<NewsArticle[]> {
    return withFallback(
      "news.getLatest",
      () => this.primary.getLatest(limit),
      () => this.fallback.getLatest(limit),
    );
  }

  getForSymbol(symbol: string, limit?: number): Promise<NewsArticle[]> {
    return withFallback(
      `news.getForSymbol(${symbol})`,
      () => this.primary.getForSymbol(symbol, limit),
      () => this.fallback.getForSymbol(symbol, limit),
    );
  }
}
