import { NextResponse } from "next/server";
import { dcfInputSchema } from "@/lib/valuation/schemas";

const QUANT_API_URL = process.env.QUANT_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = dcfInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid DCF input.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(`${QUANT_API_URL}/api/v1/valuation/dcf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(10_000),
    });

    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Quant service rejected the request.", details: payload },
        { status: upstream.status },
      );
    }

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Could not reach the quant service.",
        details: message,
        hint: `Is apps/quant-api running at ${QUANT_API_URL}? See docs/RUNNING.md.`,
      },
      { status: 502 },
    );
  }
}
