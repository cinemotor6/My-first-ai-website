import type { PortfolioRepository } from "../types";
import { MockPortfolioRepository } from "./mock-repository";

/**
 * Cached on `globalThis` rather than a module-level variable. Next.js's dev
 * server (Fast Refresh / Turbopack) can re-evaluate a module — and Route
 * Handlers vs. Server Components can even sit in separate module graphs —
 * which would otherwise silently fork this into multiple independent
 * in-memory stores (e.g. a POST via a Route Handler landing in a different
 * instance than the one a Server Component reads from). `globalThis` is the
 * one thing guaranteed to be the same object across all of that within a
 * single running process. Same pattern Prisma's Next.js docs recommend for
 * client singletons.
 */
const globalForPortfolio = globalThis as unknown as {
  __portfolioRepository?: PortfolioRepository;
};

export function getPortfolioRepository(): PortfolioRepository {
  if (!globalForPortfolio.__portfolioRepository) {
    globalForPortfolio.__portfolioRepository = new MockPortfolioRepository();
  }
  return globalForPortfolio.__portfolioRepository;
}
