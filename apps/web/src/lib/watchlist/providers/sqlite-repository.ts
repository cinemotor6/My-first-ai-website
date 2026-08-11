import type { DatabaseSync } from "node:sqlite";
import type { WatchlistItem } from "@financeapp/shared-types";
import type { WatchlistRepository } from "../types";
import { getDatabase } from "@/lib/db/sqlite";

interface WatchlistRow {
  id: string;
  symbol: string;
}

/** Persists watchlist items to a local SQLite file via node:sqlite. See lib/db/sqlite.ts. */
export class SqliteWatchlistRepository implements WatchlistRepository {
  constructor(private readonly db: DatabaseSync = getDatabase()) {}

  async listItems(userId: string): Promise<WatchlistItem[]> {
    const rows = this.db
      .prepare(
        `SELECT id, symbol FROM watchlist_items
         WHERE user_id = ? ORDER BY created_at ASC, rowid ASC`,
      )
      .all(userId) as unknown as WatchlistRow[];
    return rows.map((r) => ({ ...r }));
  }

  async addItem(userId: string, symbol: string): Promise<WatchlistItem> {
    const existing = this.db
      .prepare(`SELECT id, symbol FROM watchlist_items WHERE user_id = ? AND symbol = ?`)
      .get(userId, symbol) as unknown as WatchlistRow | undefined;
    if (existing) return { ...existing };

    const id = crypto.randomUUID();
    this.db
      .prepare(`INSERT INTO watchlist_items (id, user_id, symbol) VALUES (?, ?, ?)`)
      .run(id, userId, symbol);
    return { id, symbol };
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    this.db.prepare(`DELETE FROM watchlist_items WHERE user_id = ? AND id = ?`).run(userId, itemId);
  }
}
