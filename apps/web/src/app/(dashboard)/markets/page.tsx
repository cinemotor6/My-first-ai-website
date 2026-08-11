import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { getWatchlistRepository } from "@/lib/watchlist/providers";
import { getCurrentUserId } from "@/lib/auth-server";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { AddSymbolForm } from "./add-symbol-form";
import { RemoveSymbolButton } from "./remove-symbol-button";
import type { Quote } from "@financeapp/shared-types";

// Without this, Next prerenders the page once at build time and freezes
// the quotes — force dynamic rendering on every request.
export const dynamic = "force-dynamic";

const INDEX_SYMBOLS = ["^GSPC", "^DJI", "^IXIC", "^FTSE", "^N225", "^GDAXI"];

async function loadQuotes(symbols: string[]): Promise<Quote[]> {
  const provider = getMarketDataProvider();
  const results = await Promise.all(symbols.map((s) => provider.getQuote(s).catch(() => null)));
  return results.filter((q): q is Quote => q !== null);
}

export default async function MarketsPage() {
  const userId = await getCurrentUserId();
  const watchlistItems = await getWatchlistRepository().listItems(userId);
  const itemIdBySymbol = new Map(watchlistItems.map((item) => [item.symbol, item.id]));

  const [watchlist, indices] = await Promise.all([
    loadQuotes(watchlistItems.map((item) => item.symbol)),
    loadQuotes(INDEX_SYMBOLS),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Global Markets</h1>
        <p className="text-sm text-muted-foreground">
          Sample coverage across US, European, and Asian exchanges.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indices</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteTable quotes={indices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AddSymbolForm />
          {watchlist.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {watchlistItems.length === 0
                ? "No symbols yet. Add one above."
                : "No data available right now."}
            </p>
          ) : (
            <QuoteTable quotes={watchlist} itemIdBySymbol={itemIdBySymbol} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuoteTable({
  quotes,
  itemIdBySymbol,
}: {
  quotes: Quote[];
  itemIdBySymbol?: Map<string, string>;
}) {
  if (quotes.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available right now.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Exchange</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Change</TableHead>
          <TableHead>Volume</TableHead>
          {itemIdBySymbol && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((q) => (
          <TableRow key={q.symbol}>
            <TableCell className="font-medium">
              <Link href={`/stocks/${encodeURIComponent(q.symbol)}`} className="hover:underline">
                {q.symbol}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{q.exchange}</TableCell>
            <TableCell>{formatCurrency(q.price, q.currency)}</TableCell>
            <TableCell>
              <Badge variant={q.changePercent >= 0 ? "success" : "destructive"}>
                {formatPercent(q.changePercent)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{q.volume.toLocaleString()}</TableCell>
            {itemIdBySymbol && (
              <TableCell>
                {itemIdBySymbol.has(q.symbol) && (
                  <RemoveSymbolButton itemId={itemIdBySymbol.get(q.symbol)!} />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
