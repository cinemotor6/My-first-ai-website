import type { DatabaseSync } from "node:sqlite";
import type { PortfolioHolding } from "@financeapp/shared-types";
import type { PortfolioRepository } from "../types";
import { getDatabase } from "@/lib/db/sqlite";

interface HoldingRow {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currency: string;
}

/** Persists holdings to a local SQLite file via node:sqlite. See lib/db/sqlite.ts. */
export class SqlitePortfolioRepository implements PortfolioRepository {
  constructor(private readonly db: DatabaseSync = getDatabase()) {}

  async listHoldings(userId: string): Promise<PortfolioHolding[]> {
    const rows = this.db
      .prepare(
        `SELECT id, symbol, quantity, average_cost AS averageCost, currency
         FROM holdings WHERE user_id = ? ORDER BY created_at ASC, rowid ASC`,
      )
      .all(userId) as unknown as HoldingRow[];
    return rows.map((r) => ({ ...r }));
  }

  async addHolding(
    userId: string,
    holding: Omit<PortfolioHolding, "id">,
  ): Promise<PortfolioHolding> {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO holdings (id, user_id, symbol, quantity, average_cost, currency)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, userId, holding.symbol, holding.quantity, holding.averageCost, holding.currency);
    return { id, ...holding };
  }

  async removeHolding(userId: string, holdingId: string): Promise<void> {
    this.db.prepare(`DELETE FROM holdings WHERE user_id = ? AND id = ?`).run(userId, holdingId);
  }
}
