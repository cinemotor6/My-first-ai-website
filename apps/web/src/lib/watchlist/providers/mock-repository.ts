import type { WatchlistItem } from "@financeapp/shared-types";
import type { WatchlistRepository } from "../types";

const SAMPLE_SYMBOLS = ["AAPL", "MSFT", "SAP.DE", "7203.T", "0700.HK", "NESN.SW"];

/** In-memory, per-process store. Fine for demoing the UI; not persistent. */
export class MockWatchlistRepository implements WatchlistRepository {
  private itemsByUser = new Map<string, WatchlistItem[]>();

  private seed(userId: string): WatchlistItem[] {
    if (!this.itemsByUser.has(userId)) {
      this.itemsByUser.set(
        userId,
        SAMPLE_SYMBOLS.map((symbol) => ({ id: crypto.randomUUID(), symbol })),
      );
    }
    return this.itemsByUser.get(userId)!;
  }

  async listItems(userId: string): Promise<WatchlistItem[]> {
    return this.seed(userId);
  }

  async addItem(userId: string, symbol: string): Promise<WatchlistItem> {
    const items = this.seed(userId);
    const existing = items.find((i) => i.symbol === symbol);
    if (existing) return existing;

    const newItem: WatchlistItem = { id: crypto.randomUUID(), symbol };
    items.push(newItem);
    return newItem;
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const items = this.seed(userId);
    const index = items.findIndex((i) => i.id === itemId);
    if (index !== -1) items.splice(index, 1);
  }
}
