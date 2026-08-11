import type { WatchlistRepository } from "../types";
import { MockWatchlistRepository } from "./mock-repository";
import { SqliteWatchlistRepository } from "./sqlite-repository";

/**
 * Cached on `globalThis` rather than a module-level variable — same reason
 * as the portfolio repository singleton (see lib/portfolio/providers/
 * index.ts): Next.js's dev server (Fast Refresh / Turbopack) can
 * re-evaluate a module, and Route Handlers vs. Server Components can even
 * sit in separate module graphs, which would otherwise silently fork this
 * into multiple independent stores.
 */
const globalForWatchlist = globalThis as unknown as {
  __watchlistRepository?: WatchlistRepository;
};

function createRepository(): WatchlistRepository {
  const providerName = process.env.WATCHLIST_STORAGE?.trim() || "sqlite";

  if (providerName === "mock") {
    return new MockWatchlistRepository();
  }

  if (providerName !== "sqlite") {
    throw new Error(`Unknown WATCHLIST_STORAGE "${providerName}". Available: mock, sqlite.`);
  }

  // Fallback happens once at construction, not per-call — same reasoning
  // as the portfolio repository: a write landing in SQLite while a
  // subsequent read silently falls back to the (empty) in-memory store
  // would look like data loss. If SQLite can't even initialize, the whole
  // process uses the in-memory store instead, so behavior stays consistent
  // for the life of that process.
  try {
    return new SqliteWatchlistRepository();
  } catch (err) {
    console.warn(
      "[watchlist] Failed to initialize SQLite storage, falling back to in-memory mock data for this process:",
      err instanceof Error ? err.message : err,
    );
    return new MockWatchlistRepository();
  }
}

export function getWatchlistRepository(): WatchlistRepository {
  if (!globalForWatchlist.__watchlistRepository) {
    globalForWatchlist.__watchlistRepository = createRepository();
  }
  return globalForWatchlist.__watchlistRepository;
}
