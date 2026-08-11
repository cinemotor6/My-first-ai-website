import type { PortfolioHolding } from "@financeapp/shared-types";
import type { PortfolioRepository } from "../types";

const SAMPLE_HOLDINGS: PortfolioHolding[] = [
  { id: "1", symbol: "AAPL", quantity: 25, averageCost: 189.5, currency: "USD" },
  { id: "2", symbol: "MSFT", quantity: 10, averageCost: 372.1, currency: "USD" },
  { id: "3", symbol: "SAP.DE", quantity: 40, averageCost: 165.0, currency: "EUR" },
];

/** In-memory, per-process store. Fine for demoing the UI; not persistent. */
export class MockPortfolioRepository implements PortfolioRepository {
  private holdingsByUser = new Map<string, PortfolioHolding[]>();

  private seed(userId: string): PortfolioHolding[] {
    if (!this.holdingsByUser.has(userId)) {
      this.holdingsByUser.set(userId, [...SAMPLE_HOLDINGS]);
    }
    return this.holdingsByUser.get(userId)!;
  }

  async listHoldings(userId: string): Promise<PortfolioHolding[]> {
    return this.seed(userId);
  }

  async addHolding(
    userId: string,
    holding: Omit<PortfolioHolding, "id">,
  ): Promise<PortfolioHolding> {
    const holdings = this.seed(userId);
    const newHolding: PortfolioHolding = { ...holding, id: crypto.randomUUID() };
    holdings.push(newHolding);
    return newHolding;
  }

  async removeHolding(userId: string, holdingId: string): Promise<void> {
    const holdings = this.seed(userId);
    const index = holdings.findIndex((h) => h.id === holdingId);
    if (index !== -1) holdings.splice(index, 1);
  }
}
