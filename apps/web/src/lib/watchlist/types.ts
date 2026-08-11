import type { WatchlistItem } from "@financeapp/shared-types";

/**
 * Storage-agnostic interface for a user's watchlist (symbols they want to
 * track, distinct from portfolio holdings). Default implementation
 * (`SqliteWatchlistRepository`) persists to the same local SQLite file as
 * the portfolio repository via Node's built-in `node:sqlite`.
 * `MockWatchlistRepository` keeps items in memory instead (reset on server
 * restart); it's both an explicit opt-out (`WATCHLIST_STORAGE=mock`) and
 * the automatic fallback if SQLite fails to initialize. See
 * docs/ARCHITECTURE.md.
 */
export interface WatchlistRepository {
  listItems(userId: string): Promise<WatchlistItem[]>;
  addItem(userId: string, symbol: string): Promise<WatchlistItem>;
  removeItem(userId: string, itemId: string): Promise<void>;
}
