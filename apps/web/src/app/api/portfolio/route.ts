import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortfolioRepository } from "@/lib/portfolio/providers";
import { getCurrentUserId } from "@/lib/auth-server";

const addHoldingSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  quantity: z.number().positive(),
  averageCost: z.number().nonnegative(),
  currency: z.string().trim().length(3),
});

export async function GET() {
  const userId = await getCurrentUserId();
  try {
    const holdings = await getPortfolioRepository().listHoldings(userId);
    return NextResponse.json(holdings);
  } catch (err) {
    console.error("[api/portfolio] Failed to list holdings:", err);
    return NextResponse.json({ error: "Could not load portfolio holdings." }, { status: 500 });
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

  const parsed = addHoldingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid holding.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const holding = await getPortfolioRepository().addHolding(userId, parsed.data);
    return NextResponse.json(holding, { status: 201 });
  } catch (err) {
    console.error("[api/portfolio] Failed to add holding:", err);
    return NextResponse.json({ error: "Could not add the holding." }, { status: 500 });
  }
}
