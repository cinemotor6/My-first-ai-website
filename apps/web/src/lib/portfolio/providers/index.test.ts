import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env.PORTFOLIO_STORAGE;
const globalForPortfolio = globalThis as unknown as { __portfolioRepository?: unknown };

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("./sqlite-repository");
  // The registry caches its singleton on globalThis specifically so it
  // survives module re-evaluation — which means these tests, which force
  // module re-evaluation via resetModules() to pick a fresh env var, must
  // clear that cache themselves or every test after the first would just
  // see whatever the first test cached.
  delete globalForPortfolio.__portfolioRepository;
  if (ORIGINAL_ENV === undefined) {
    delete process.env.PORTFOLIO_STORAGE;
  } else {
    process.env.PORTFOLIO_STORAGE = ORIGINAL_ENV;
  }
});

describe("getPortfolioRepository", () => {
  it("defaults to SqlitePortfolioRepository", async () => {
    delete process.env.PORTFOLIO_STORAGE;
    vi.resetModules();
    const { getPortfolioRepository } = await import("./index");
    const { SqlitePortfolioRepository } = await import("./sqlite-repository");
    expect(getPortfolioRepository()).toBeInstanceOf(SqlitePortfolioRepository);
  });

  it("uses MockPortfolioRepository when PORTFOLIO_STORAGE=mock", async () => {
    process.env.PORTFOLIO_STORAGE = "mock";
    vi.resetModules();
    const { getPortfolioRepository } = await import("./index");
    const { MockPortfolioRepository } = await import("./mock-repository");
    expect(getPortfolioRepository()).toBeInstanceOf(MockPortfolioRepository);
  });

  it("falls back to MockPortfolioRepository if SQLite fails to initialize", async () => {
    delete process.env.PORTFOLIO_STORAGE;
    vi.resetModules();
    vi.doMock("./sqlite-repository", () => ({
      SqlitePortfolioRepository: class {
        constructor() {
          throw new Error("simulated: cannot open database file");
        }
      },
    }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getPortfolioRepository } = await import("./index");
    const { MockPortfolioRepository } = await import("./mock-repository");

    expect(getPortfolioRepository()).toBeInstanceOf(MockPortfolioRepository);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to initialize SQLite storage"),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });

  it("throws a clear error for an unknown PORTFOLIO_STORAGE value", async () => {
    process.env.PORTFOLIO_STORAGE = "nonsense";
    vi.resetModules();
    const { getPortfolioRepository } = await import("./index");
    expect(() => getPortfolioRepository()).toThrow(/Unknown PORTFOLIO_STORAGE/);
  });
});
