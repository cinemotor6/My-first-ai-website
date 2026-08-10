import type { PortfolioHolding } from "@financeapp/shared-types";

/**
 * Storage-agnostic interface for portfolio data. The mock implementation
 * keeps holdings in memory (reset on server restart); a production
 * implementation would back this with Postgres (e.g. via Prisma) keyed by
 * the authenticated user's ID. See docs/ARCHITECTURE.md.
 */
export interface PortfolioRepository {
  listHoldings(userId: string): Promise<PortfolioHolding[]>;
  addHolding(userId: string, holding: Omit<PortfolioHolding, "id">): Promise<PortfolioHolding>;
  removeHolding(userId: string, holdingId: string): Promise<void>;
}
