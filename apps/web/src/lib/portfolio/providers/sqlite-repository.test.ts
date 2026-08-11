import { describe, expect, it } from "vitest";
import { SqlitePortfolioRepository } from "./sqlite-repository";
import { createDatabase } from "@/lib/db/sqlite";

function makeRepo() {
  // A fresh in-memory database per test — fast, isolated, no file I/O,
  // and bypasses the globalThis-cached singleton entirely.
  return new SqlitePortfolioRepository(createDatabase(":memory:"));
}

describe("SqlitePortfolioRepository", () => {
  it("starts empty for a new user", async () => {
    const repo = makeRepo();
    expect(await repo.listHoldings("user-1")).toEqual([]);
  });

  it("adds a holding and returns it with a generated id", async () => {
    const repo = makeRepo();
    const holding = await repo.addHolding("user-1", {
      symbol: "AAPL",
      quantity: 10,
      averageCost: 150,
      currency: "USD",
    });
    expect(holding.id).toBeTruthy();
    expect(holding.symbol).toBe("AAPL");
  });

  it("persists holdings across repository instances sharing the same connection", async () => {
    const db = createDatabase(":memory:");
    const repo1 = new SqlitePortfolioRepository(db);
    await repo1.addHolding("user-1", { symbol: "MSFT", quantity: 5, averageCost: 300, currency: "USD" });

    const repo2 = new SqlitePortfolioRepository(db);
    const holdings = await repo2.listHoldings("user-1");
    expect(holdings).toHaveLength(1);
    expect(holdings[0].symbol).toBe("MSFT");
  });

  it("lists holdings in insertion order", async () => {
    const repo = makeRepo();
    await repo.addHolding("user-1", { symbol: "AAPL", quantity: 1, averageCost: 1, currency: "USD" });
    await repo.addHolding("user-1", { symbol: "MSFT", quantity: 1, averageCost: 1, currency: "USD" });
    await repo.addHolding("user-1", { symbol: "GOOGL", quantity: 1, averageCost: 1, currency: "USD" });

    const holdings = await repo.listHoldings("user-1");
    expect(holdings.map((h) => h.symbol)).toEqual(["AAPL", "MSFT", "GOOGL"]);
  });

  it("isolates holdings between users", async () => {
    const repo = makeRepo();
    await repo.addHolding("user-1", { symbol: "AAPL", quantity: 1, averageCost: 1, currency: "USD" });
    await repo.addHolding("user-2", { symbol: "MSFT", quantity: 1, averageCost: 1, currency: "USD" });

    expect(await repo.listHoldings("user-1")).toHaveLength(1);
    expect(await repo.listHoldings("user-2")).toHaveLength(1);
    expect((await repo.listHoldings("user-1"))[0].symbol).toBe("AAPL");
  });

  it("removes a holding by id, scoped to the owning user", async () => {
    const repo = makeRepo();
    const holding = await repo.addHolding("user-1", {
      symbol: "AAPL",
      quantity: 1,
      averageCost: 1,
      currency: "USD",
    });

    // A different user trying to delete someone else's holding is a no-op.
    await repo.removeHolding("user-2", holding.id);
    expect(await repo.listHoldings("user-1")).toHaveLength(1);

    await repo.removeHolding("user-1", holding.id);
    expect(await repo.listHoldings("user-1")).toHaveLength(0);
  });

  it("removing a non-existent holding does not throw", async () => {
    const repo = makeRepo();
    await expect(repo.removeHolding("user-1", "does-not-exist")).resolves.not.toThrow();
  });
});
