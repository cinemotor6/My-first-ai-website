import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart } from "@/components/charts/line-chart";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { SymbolNotFoundError } from "@/lib/market-data/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

async function loadStockData(symbol: string) {
  const provider = getMarketDataProvider();
  try {
    const [quote, profile, bars, financials] = await Promise.all([
      provider.getQuote(symbol),
      provider.getCompanyProfile(symbol),
      provider.getHistoricalBars(symbol, 90),
      provider.getFinancialStatement(symbol),
    ]);
    return { quote, profile, bars, financials };
  } catch (err) {
    if (err instanceof SymbolNotFoundError) return null;
    throw err;
  }
}

export default async function StockDetailPage(props: PageProps<"/stocks/[symbol]">) {
  const { symbol } = await props.params;
  const data = await loadStockData(symbol);

  if (!data) notFound();

  const { quote, profile, bars, financials } = data;

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.description}</p>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
