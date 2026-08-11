import { NextResponse } from "next/server";
import { getWatchlistRepository } from "@/lib/watchlist/providers";
import { getCurrentUserId } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/watchlist/[id]">,
) {
  const { id } = await context.params;
  const userId = await getCurrentUserId();

  try {
    await getWatchlistRepository().removeItem(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[api/watchlist/[id]] Failed to remove item:", err);
    return NextResponse.json({ error: "Could not remove the symbol." }, { status: 500 });
  }
}
