import type { PortfolioRepository } from "../types";
import { MockPortfolioRepository } from "./mock-repository";
import { SqlitePortfolioRepository } from "./sqlite-repository";

/**
 * Cached on `globalThis` rather than a module-level variable. Next.js's dev
 * server (Fast Refresh / Turbopack) can re-evaluate a module — and Route
 * Handlers vs. Server Components can even sit in separate module graphs —
 * which would otherwise silently fork this into multiple independent
 * stores (e.g. a POST via a Route Handler landing in a different instance
 * than the one a Server Component reads from). `globalThis` is the one
 * thing guaranteed to be the same object across all of that within a
 * single running process. Same pattern Prisma's Next.js docs recommend for
 * client singletons.
 */
const globalForPortfolio = globalThis as unknown as {
  __portfolioRepository?: PortfolioRepository;
};

function createRepository(): PortfolioRepository {
  const providerName = process.env.PORTFOLIO_STORAGE?.trim() || "sqlite";

  if (providerName === "mock") {
    return new MockPortfolioRepository();
  }

  if (providerName !== "sqlite") {
    throw new Error(`Unknown PORTFOLIO_STORAGE "${providerName}". Available: mock, sqlite.`);
  }

  // Unlike the market-data/news/FX providers, this isn't wrapped in a
  // per-call fallback — a write landing in SQLite while a subsequent read
  // silently falls back to the (empty) in-memory store would look like
  // data loss. Instead, the fallback happens once at construction: if
  // SQLite can't even initialize (e.g. no write access to the configured
  // path), the whole process uses the in-memory store instead, so
  // behavior stays consistent for the life of that process.
  try {
    return new SqlitePortfolioRepository();
  } catch (err) {
    console.warn(
      "[portfolio] Failed to initialize SQLite storage, falling back to in-memory mock data for this process:",
      err instanceof Error ? err.message : err,
    );
    return new MockPortfolioRepository();
  }
}

export function getPortfolioRepository(): PortfolioRepository {
  if (!globalForPortfolio.__portfolioRepository) {
    globalForPortfolio.__portfolioRepository = createRepository();
  }
  return globalForPortfolio.__portfolioRepository;
}
