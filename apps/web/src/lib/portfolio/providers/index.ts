import type { PortfolioRepository } from "../types";
import { MockPortfolioRepository } from "./mock-repository";

let cached: PortfolioRepository | null = null;

/** Swap this out for a Postgres-backed implementation once auth + DB are wired up. */
export function getPortfolioRepository(): PortfolioRepository {
  if (!cached) cached = new MockPortfolioRepository();
  return cached;
}
