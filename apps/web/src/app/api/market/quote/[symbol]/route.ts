import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/market-data/providers";
import { SymbolNotFoundError } from "@/lib/market-data/types";

export async function GET(_request: Request, context: RouteContext<"/api/market/quote/[symbol]">) {
  const { symbol } = await context.params;

  if (!symbol || symbol.length > 20) {
    return NextResponse.json({ error: "Invalid symbol." }, { status: 400 });
  }

  try {
    const quote = await getMarketDataProvider().getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err) {
    if (err instanceof SymbolNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch quote." }, { status: 502 });
  }
}
