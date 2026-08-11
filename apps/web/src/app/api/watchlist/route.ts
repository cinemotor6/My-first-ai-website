import { NextResponse } from "next/server";
import { z } from "zod";
import { getWatchlistRepository } from "@/lib/watchlist/providers";
import { getCurrentUserId } from "@/lib/auth-server";

const addItemSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
});

export async function GET() {
  const userId = await getCurrentUserId();
  try {
    const items = await getWatchlistRepository().listItems(userId);
    return NextResponse.json(items);
  } catch (err) {
    console.error("[api/watchlist] Failed to list items:", err);
    return NextResponse.json({ error: "Could not load the watchlist." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid watchlist item.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const item = await getWatchlistRepository().addItem(
      userId,
      parsed.data.symbol.toUpperCase(),
    );
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[api/watchlist] Failed to add item:", err);
    return NextResponse.json({ error: "Could not add the symbol." }, { status: 500 });
  }
}
