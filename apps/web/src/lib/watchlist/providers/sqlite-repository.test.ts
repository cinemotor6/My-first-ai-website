import { describe, expect, it } from "vitest";
import { SqliteWatchlistRepository } from "./sqlite-repository";
import { createDatabase } from "@/lib/db/sqlite";

function makeRepo() {
  // A fresh in-memory database per test — fast, isolated, no file I/O,
  // and bypasses the globalThis-cached singleton entirely.
  return new SqliteWatchlistRepository(createDatabase(":memory:"));
}

describe("SqliteWatchlistRepository", () => {
  it("starts empty for a new user", async () => {
    const repo = makeRepo();
    expect(await repo.listItems("user-1")).toEqual([]);
  });

  it("adds an item and returns it with a generated id", async () => {
    const repo = makeRepo();
    const item = await repo.addItem("user-1", "AAPL");
    expect(item.id).toBeTruthy();
    expect(item.symbol).toBe("AAPL");
  });

  it("persists items across repository instances sharing the same connection", async () => {
    const db = createDatabase(":memory:");
    const repo1 = new SqliteWatchlistRepository(db);
    await repo1.addItem("user-1", "MSFT");

    const repo2 = new SqliteWatchlistRepository(db);
    const items = await repo2.listItems("user-1");
    expect(items).toHaveLength(1);
    expect(items[0].symbol).toBe("MSFT");
  });

  it("lists items in insertion order", async () => {
    const repo = makeRepo();
    await repo.addItem("user-1", "AAPL");
    await repo.addItem("user-1", "MSFT");
    await repo.addItem("user-1", "GOOGL");

    const items = await repo.listItems("user-1");
    expect(items.map((i) => i.symbol)).toEqual(["AAPL", "MSFT", "GOOGL"]);
  });

  it("isolates items between users", async () => {
    const repo = makeRepo();
    await repo.addItem("user-1", "AAPL");
    await repo.addItem("user-2", "MSFT");

    expect(await repo.listItems("user-1")).toHaveLength(1);
    expect(await repo.listItems("user-2")).toHaveLength(1);
    expect((await repo.listItems("user-1"))[0].symbol).toBe("AAPL");
  });

  it("adding a duplicate symbol for the same user returns the existing item", async () => {
    const repo = makeRepo();
    const first = await repo.addItem("user-1", "AAPL");
    const second = await repo.addItem("user-1", "AAPL");

    expect(second.id).toBe(first.id);
    expect(await repo.listItems("user-1")).toHaveLength(1);
  });

  it("removes an item by id, scoped to the owning user", async () => {
    const repo = makeRepo();
    const item = await repo.addItem("user-1", "AAPL");

    // A different user trying to delete someone else's item is a no-op.
    await repo.removeItem("user-2", item.id);
    expect(await repo.listItems("user-1")).toHaveLength(1);

    await repo.removeItem("user-1", item.id);
    expect(await repo.listItems("user-1")).toHaveLength(0);
  });

  it("removing a non-existent item does not throw", async () => {
    const repo = makeRepo();
    await expect(repo.removeItem("user-1", "does-not-exist")).resolves.not.toThrow();
  });
});
