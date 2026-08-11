import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env.WATCHLIST_STORAGE;
const globalForWatchlist = globalThis as unknown as { __watchlistRepository?: unknown };

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("./sqlite-repository");
  // The registry caches its singleton on globalThis specifically so it
  // survives module re-evaluation — which means these tests, which force
  // module re-evaluation via resetModules() to pick a fresh env var, must
  // clear that cache themselves or every test after the first would just
  // see whatever the first test cached.
  delete globalForWatchlist.__watchlistRepository;
  if (ORIGINAL_ENV === undefined) {
    delete process.env.WATCHLIST_STORAGE;
  } else {
    process.env.WATCHLIST_STORAGE = ORIGINAL_ENV;
  }
});

describe("getWatchlistRepository", () => {
  it("defaults to SqliteWatchlistRepository", async () => {
    delete process.env.WATCHLIST_STORAGE;
    vi.resetModules();
    const { getWatchlistRepository } = await import("./index");
    const { SqliteWatchlistRepository } = await import("./sqlite-repository");
    expect(getWatchlistRepository()).toBeInstanceOf(SqliteWatchlistRepository);
  });

  it("uses MockWatchlistRepository when WATCHLIST_STORAGE=mock", async () => {
    process.env.WATCHLIST_STORAGE = "mock";
    vi.resetModules();
    const { getWatchlistRepository } = await import("./index");
    const { MockWatchlistRepository } = await import("./mock-repository");
    expect(getWatchlistRepository()).toBeInstanceOf(MockWatchlistRepository);
  });

  it("falls back to MockWatchlistRepository if SQLite fails to initialize", async () => {
    delete process.env.WATCHLIST_STORAGE;
    vi.resetModules();
    vi.doMock("./sqlite-repository", () => ({
      SqliteWatchlistRepository: class {
        constructor() {
          throw new Error("simulated: cannot open database file");
        }
      },
    }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getWatchlistRepository } = await import("./index");
    const { MockWatchlistRepository } = await import("./mock-repository");

    expect(getWatchlistRepository()).toBeInstanceOf(MockWatchlistRepository);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to initialize SQLite storage"),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });

  it("throws a clear error for an unknown WATCHLIST_STORAGE value", async () => {
    process.env.WATCHLIST_STORAGE = "nonsense";
    vi.resetModules();
    const { getWatchlistRepository } = await import("./index");
    expect(() => getWatchlistRepository()).toThrow(/Unknown WATCHLIST_STORAGE/);
  });
});
