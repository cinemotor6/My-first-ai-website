import type { PortfolioHolding } from "@financeapp/shared-types";

/**
 * Storage-agnostic interface for portfolio data, keyed by the
 * authenticated user's ID. Default implementation
 * (`SqlitePortfolioRepository`) persists to a local SQLite file via
 * Node's built-in `node:sqlite` — no external database service, no ORM,
 * no paid tier. `MockPortfolioRepository` keeps holdings in memory
 * instead (reset on server restart); it's both an explicit opt-out
 * (`PORTFOLIO_STORAGE=mock`) and the automatic fallback if SQLite fails to
 * initialize. See docs/ARCHITECTURE.md.
 */
export interface PortfolioRepository {
  listHoldings(userId: string): Promise<PortfolioHolding[]>;
  addHolding(userId: string, holding: Omit<PortfolioHolding, "id">): Promise<PortfolioHolding>;
  removeHolding(userId: string, holdingId: string): Promise<void>;
}
