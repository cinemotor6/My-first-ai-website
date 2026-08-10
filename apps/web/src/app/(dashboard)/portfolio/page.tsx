import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPortfolioRepository } from "@/lib/portfolio/providers";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { getCurrentUserId } from "@/lib/auth-server";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function PortfolioPage() {
  const userId = await getCurrentUserId();
  const repo = getPortfolioRepository();
  const marketData = getMarketDataProvider();

  const holdings = await repo.listHoldings(userId);
  const quotes = await Promise.all(
    holdings.map((h) => marketData.getQuote(h.symbol).catch(() => null)),
  );

  const rows = holdings.map((h, i) => {
    const quote = quotes[i];
    const marketValue = quote ? quote.price * h.quantity : null;
    const costBasis = h.averageCost * h.quantity;
    const gainPercent = marketValue ? ((marketValue - costBasis) / costBasis) * 100 : null;
    return { holding: h, quote, marketValue, costBasis, gainPercent };
  });

  const totalValue = rows.reduce((sum, r) => sum + (r.marketValue ?? 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Sample holdings for user &quot;{userId}&quot;, priced with mock market data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total value: {formatCurrency(totalValue)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg cost</TableHead>
                <TableHead>Market value</TableHead>
                <TableHead>Gain/loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ holding, quote, marketValue, gainPercent }) => (
                <TableRow key={holding.id}>
                  <TableCell className="font-medium">{holding.symbol}</TableCell>
                  <TableCell>{holding.quantity}</TableCell>
                  <TableCell>{formatCurrency(holding.averageCost, holding.currency)}</TableCell>
                  <TableCell>
                    {marketValue !== null ? formatCurrency(marketValue, quote?.currency) : "—"}
                  </TableCell>
                  <TableCell className={gainPercent !== null && gainPercent < 0 ? "text-down" : "text-up"}>
                    {gainPercent !== null ? formatPercent(gainPercent) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
