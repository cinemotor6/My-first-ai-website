import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart } from "@/components/charts/line-chart";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { SymbolNotFoundError } from "@/lib/market-data/types";
import { getNewsProvider } from "@/lib/news/providers";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { FinancialStatement, NewsArticle } from "@financeapp/shared-types";

// Without this, Next prerenders the page once at build time and freezes
// the quote/financials/news — force dynamic rendering on every request.
export const dynamic = "force-dynamic";

/**
 * Page-level dynamic route params aren't reliably URL-decoded by Next.js
 * (confirmed by comparing against the sibling Route Handler at
 * app/api/market/quote/[symbol]/route.ts, whose `context.params` *is*
 * decoded) — so a symbol containing a reserved character, e.g. the index
 * ticker "^GSPC", arrives here as the literal string "%5EGSPC" and fails
 * every lookup. Decode defensively; a plain symbol with no `%` round-trips
 * unchanged, and a malformed sequence falls back to the raw value instead
 * of throwing.
 */
function decodeSymbolParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function loadStockData(symbol: string) {
  const provider = getMarketDataProvider();
  try {
    const [quote, profile, bars] = await Promise.all([
      provider.getQuote(symbol),
      provider.getCompanyProfile(symbol),
      provider.getHistoricalBars(symbol, 90),
    ]);

    // Indices (S&P 500, DAX, ...) don't have financial statements — skip
    // that fetch and the card entirely rather than showing fabricated data.
    const isIndex = profile.sector === "Index";
    let financials: FinancialStatement | null = null;
    if (!isIndex) {
      financials = await provider.getFinancialStatement(symbol);
    }

    const news: NewsArticle[] = await getNewsProvider()
      .getForSymbol(symbol, 5)
      .catch(() => []);

    return { quote, profile, bars, financials, news };
  } catch (err) {
    if (err instanceof SymbolNotFoundError) return null;
    throw err;
  }
}

export default async function StockDetailPage(props: PageProps<"/stocks/[symbol]">) {
  const { symbol: rawSymbol } = await props.params;
  const symbol = decodeSymbolParam(rawSymbol);
  const data = await loadStockData(symbol);

  if (!data) notFound();

  const { quote, profile, bars, financials, news } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {profile.name} <span className="text-muted-foreground">({profile.symbol})</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile.exchange} · {profile.country} · {profile.sector}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatCurrency(quote.price, quote.currency)}</div>
          <Badge variant={quote.changePercent >= 0 ? "success" : "destructive"}>
            {formatPercent(quote.changePercent)} today
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>90-day price history</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart bars={bars} />
        </CardContent>
      </Card>

      <div className={financials ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {profile.description || "No description available."}
            </p>
          </CardContent>
        </Card>

        {financials && (
          <Card>
            <CardHeader>
              <CardTitle>Income statement (FY{financials.fiscalYear})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {financials.incomeStatement.map((line) => (
                <div key={line.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium">
                    {formatCurrency(line.value, financials.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {news.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related news</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm hover:underline"
              >
                <div className="font-medium text-foreground">{article.headline}</div>
                <div className="text-xs text-muted-foreground">
                  {article.source} · {new Date(article.publishedAt).toLocaleDateString()}
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
