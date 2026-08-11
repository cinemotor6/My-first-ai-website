import { describe, expect, it } from "vitest";
import { parseFrankfurterRate, FrankfurterDataError } from "./parse";
import type { FrankfurterLatestResponse } from "./types";

describe("parseFrankfurterRate", () => {
  const response: FrankfurterLatestResponse = {
    amount: 1,
    base: "USD",
    date: "2026-01-01",
    rates: { EUR: 0.93, GBP: 0.79 },
  };

  it("returns the rate for the requested currency", () => {
    expect(parseFrankfurterRate(response, "EUR")).toBe(0.93);
  });

  it("is case-insensitive", () => {
    expect(parseFrankfurterRate(response, "eur")).toBe(0.93);
  });

  it("throws FrankfurterDataError when the currency isn't in the response", () => {
    expect(() => parseFrankfurterRate(response, "JPY")).toThrow(FrankfurterDataError);
  });
});
