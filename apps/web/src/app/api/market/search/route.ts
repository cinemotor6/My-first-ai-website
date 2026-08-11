import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/market-data/providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length === 0) {
    return NextResponse.json([]);
  }
  if (query.length > 50) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  try {
    const results = await getMarketDataProvider().searchSymbols(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed." }, { status: 502 });
  }
}
