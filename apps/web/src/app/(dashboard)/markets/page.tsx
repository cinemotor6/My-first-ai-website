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
import { formatCurrency, formatPercent } from "@/lib/utils";

const ALL_SYMBOLS = ["AAPL", "MSFT", "SAP.DE", "7203.T", "0700.HK", "NESN.SW"];

export default async function MarketsPage() {
  const provider = getMarketDataProvider();
  const quotes = await Promise.all(ALL_SYMBOLS.map((s) => provider.getQuote(s)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Global Markets</h1>
        <p className="text-sm text-muted-foreground">
          Sample coverage across US, European, and Asian exchanges (mock data).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.symbol}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${q.symbol}`} className="hover:underline">
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
                  <TableCell className="text-muted-foreground">
                    {q.volume.toLocaleString()}
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
