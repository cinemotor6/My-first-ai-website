import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Uses Node's built-in `node:sqlite` (stable-ish/experimental since Node
 * 22.5, unflagged) rather than a third-party driver like better-sqlite3 or
 * an ORM like Prisma — zero extra dependencies, so there's no npm package
 * to install and no native-binary download to fail in a network-restricted
 * environment. It's marked experimental by Node; if that becomes a
 * problem, `DatabaseSync` is a small enough surface that swapping to
 * better-sqlite3 behind the same two functions here wouldn't touch
 * anything outside this file.
 */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS holdings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity REAL NOT NULL,
    average_cost REAL NOT NULL,
    currency TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);

  CREATE TABLE IF NOT EXISTS watchlist_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, symbol)
  );
  CREATE INDEX IF NOT EXISTS idx_watchlist_items_user_id ON watchlist_items(user_id);
`;

export function createDatabase(dbPath: string): DatabaseSync {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

function defaultDbPath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), ".data", "app.db");
}

// Cached on globalThis rather than a module-level variable — same reason
// as the portfolio repository singleton (see lib/portfolio/providers/
// index.ts): Next.js's dev server can re-evaluate a module, and Route
// Handlers vs. Server Components can sit in separate module graphs, which
// would otherwise silently open two independent connections to what's
// supposed to be one database.
const globalForDb = globalThis as unknown as { __sqliteDb?: DatabaseSync };

export function getDatabase(): DatabaseSync {
  if (!globalForDb.__sqliteDb) {
    globalForDb.__sqliteDb = createDatabase(defaultDbPath());
  }
  return globalForDb.__sqliteDb;
}
