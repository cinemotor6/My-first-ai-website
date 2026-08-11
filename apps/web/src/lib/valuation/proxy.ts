import { NextResponse } from "next/server";
import type { ZodType } from "zod";

const QUANT_API_URL = process.env.QUANT_API_URL || "http://localhost:8000";

/**
 * Validates a request body against `schema`, forwards it to the Python
 * quant service at `quantApiPath`, and relays the response — with clear
 * error responses at each failure point (bad JSON, failed validation,
 * quant service down or rejecting the request) instead of a generic crash.
 */
export async function proxyToQuantApi<T>(
  request: Request,
  quantApiPath: string,
  schema: ZodType<T>,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(`${QUANT_API_URL}${quantApiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(20_000),
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
