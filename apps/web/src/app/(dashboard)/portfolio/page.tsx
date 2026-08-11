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
import { getFxRateProvider } from "@/lib/fx/providers";
import { getCurrentUserId } from "@/lib/auth-server";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { AddHoldingForm } from "./add-holding-form";
import { RemoveHoldingButton } from "./remove-holding-button";

// Portfolio mutates via POST/DELETE and must reflect writes on the very
// next render — without this, Next prerenders the page once at build time
// and every visitor would see the same frozen snapshot.
export const dynamic = "force-dynamic";

const BASE_CURRENCY = "USD";

export default async function PortfolioPage() {
  const userId = await getCurrentUserId();
  const repo = getPortfolioRepository();
  const marketData = getMarketDataProvider();
  const fx = getFxRateProvider();

  const holdings = await repo.listHoldings(userId);
  const quotes = await Promise.all(
    holdings.map((h) => marketData.getQuote(h.symbol).catch(() => null)),
  );

  const rows = await Promise.all(
    holdings.map(async (h, i) => {
      const quote = quotes[i];
      const marketValue = quote ? quote.price * h.quantity : null;
      const costBasis = h.averageCost * h.quantity;
      const gainPercent = marketValue ? ((marketValue - costBasis) / costBasis) * 100 : null;

      let marketValueBase: number | null = null;
      if (marketValue !== null && quote) {
        try {
          const rate = await fx.getRate(quote.currency, BASE_CURRENCY);
          marketValueBase = marketValue * rate;
        } catch {
          marketValueBase = null;
        }
      }

      return { holding: h, quote, marketValue, marketValueBase, gainPercent };
    }),
  );

  const totalKnown = rows.every((r) => r.marketValueBase !== null);
  const totalValueBase = rows.reduce((sum, r) => sum + (r.marketValueBase ?? 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Sample holdings for user &quot;{userId}&quot;, priced with live market data
          where available.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Total value ({BASE_CURRENCY}): {formatCurrency(totalValueBase)}
            {!totalKnown && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (some holdings excluded — no quote or FX rate available)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AddHoldingForm />
          {holdings.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No holdings yet. Add one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Avg cost</TableHead>
                  <TableHead>Market value</TableHead>
                  <TableHead>Gain/loss</TableHead>
                  <TableHead className="w-10" />
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
                    <TableCell
                      className={
                        gainPercent === null
                          ? "text-muted-foreground"
                          : gainPercent < 0
                            ? "text-down"
                            : "text-up"
                      }
                    >
                      {gainPercent !== null ? formatPercent(gainPercent) : "—"}
                    </TableCell>
                    <TableCell>
                      <RemoveHoldingButton holdingId={holding.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
