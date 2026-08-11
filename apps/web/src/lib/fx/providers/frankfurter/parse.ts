import type { FrankfurterLatestResponse } from "./types";

export class FrankfurterDataError extends Error {}

export function parseFrankfurterRate(json: FrankfurterLatestResponse, to: string): number {
  const rate = json.rates?.[to.toUpperCase()];
  if (rate === undefined) {
    throw new FrankfurterDataError(`No rate for ${json.base} -> ${to} in Frankfurter response.`);
  }
  return rate;
}
