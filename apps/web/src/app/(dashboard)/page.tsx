import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { getNewsProvider } from "@/lib/news/providers";
import { getMacroProvider } from "@/lib/macro/providers";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import Link from "next/link";
import type { Quote } from "@financeapp/shared-types";

// Without this, Next prerenders the page once at build time and freezes
// the quotes/news/macro data — force dynamic rendering on every request.
export const dynamic = "force-dynamic";

const WATCHLIST = ["AAPL", "MSFT", "SAP.DE", "7203.T", "0700.HK", "NESN.SW"];

export default async function OverviewPage() {
  const marketData = getMarketDataProvider();
  const news = getNewsProvider();
  const macro = getMacroProvider();

  const [quotes, latestNews, indicators] = await Promise.all([
    Promise.all(
      WATCHLIST.map((symbol) => marketData.getQuote(symbol).catch(() => null)),
    ).then((results) => results.filter((q): q is Quote => q !== null)),
    news.getLatest(4),
    macro.getIndicators("United States"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live data where available, with an automatic fallback to sample data.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {quotes.map((q) => (
          <Link key={q.symbol} href={`/stocks/${q.symbol}`}>
            <Card className="transition-colors hover:border-foreground/30">
              <CardHeader>
                <CardTitle>{q.symbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-lg font-semibold">
                  {formatCurrency(q.price, q.currency)}
                </div>
                <Badge variant={q.changePercent >= 0 ? "success" : "destructive"}>
                  {formatPercent(q.changePercent)}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest news</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestNews.map((article) => (
              <div key={article.id} className="text-sm">
                <div className="font-medium text-foreground">{article.headline}</div>
                <div className="text-xs text-muted-foreground">
                  {article.source} · {article.relatedSymbols.join(", ")}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>US macro indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.map((ind) => (
              <div key={ind.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ind.name}</span>
                <span
                  className={cn(
                    "font-medium",
                    ind.previousValue !== undefined &&
                      (ind.value >= ind.previousValue ? "text-up" : "text-down"),
                  )}
                >
                  {ind.value}
                  {ind.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
