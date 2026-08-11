import { describe, expect, it } from "vitest";
import { createDatabase } from "./sqlite";

describe("createDatabase", () => {
  it("creates the holdings table", () => {
    const db = createDatabase(":memory:");
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='holdings'")
      .all();
    expect(tables).toHaveLength(1);
  });

  it("is idempotent — calling exec twice on the same schema doesn't throw", () => {
    const db = createDatabase(":memory:");
    expect(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS holdings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          quantity REAL NOT NULL,
          average_cost REAL NOT NULL,
          currency TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }).not.toThrow();
  });

  it("enforces column presence via insert/select round-trip", () => {
    const db = createDatabase(":memory:");
    db.prepare(
      "INSERT INTO holdings (id, user_id, symbol, quantity, average_cost, currency) VALUES (?, ?, ?, ?, ?, ?)",
    ).run("id-1", "user-1", "AAPL", 10, 150.5, "USD");

    const row = db.prepare("SELECT * FROM holdings WHERE id = ?").get("id-1") as
      | Record<string, unknown>
      | undefined;
    expect(row?.symbol).toBe("AAPL");
    expect(row?.quantity).toBe(10);
  });
});
