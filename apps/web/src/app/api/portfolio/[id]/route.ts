import { NextResponse } from "next/server";
import { getPortfolioRepository } from "@/lib/portfolio/providers";
import { getCurrentUserId } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/portfolio/[id]">,
) {
  const { id } = await context.params;
  const userId = await getCurrentUserId();

  try {
    await getPortfolioRepository().removeHolding(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[api/portfolio/[id]] Failed to remove holding:", err);
    return NextResponse.json({ error: "Could not remove the holding." }, { status: 500 });
  }
}
