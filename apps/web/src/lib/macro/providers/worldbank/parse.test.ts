import { describe, expect, it } from "vitest";
import { parseWorldBankIndicator, WorldBankDataError } from "./parse";
import type { WorldBankObservation } from "./types";

const META = { id: "us-gdp-growth", name: "GDP Growth (annual %)", region: "United States", unit: "%" };

function makeResponse(observations: WorldBankObservation[]): unknown {
  return [{ page: 1, pages: 1, per_page: "50", total: observations.length }, observations];
}

describe("parseWorldBankIndicator", () => {
  it("uses the most recent observation as the current value", () => {
    const json = makeResponse([
      {
        indicator: { id: "NY.GDP.MKTP.KD.ZG", value: "GDP growth (annual %)" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2023",
        value: 2.9,
        unit: "",
      },
      {
        indicator: { id: "NY.GDP.MKTP.KD.ZG", value: "GDP growth (annual %)" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2022",
        value: 1.9,
        unit: "",
      },
    ]);

    const result = parseWorldBankIndicator(json, META);
    expect(result.value).toBe(2.9);
    expect(result.period).toBe("2023");
    expect(result.previousValue).toBe(1.9);
  });

  it("sorts observations by date even if the API returns them out of order", () => {
    const json = makeResponse([
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2021",
        value: 5.9,
        unit: "",
      },
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2023",
        value: 2.9,
        unit: "",
      },
    ]);

    const result = parseWorldBankIndicator(json, META);
    expect(result.period).toBe("2023");
    expect(result.value).toBe(2.9);
  });

  it("skips null observations and uses the next available value", () => {
    const json = makeResponse([
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2023",
        value: null,
        unit: "",
      },
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2022",
        value: 1.9,
        unit: "",
      },
    ]);

    const result = parseWorldBankIndicator(json, META);
    expect(result.period).toBe("2022");
    expect(result.value).toBe(1.9);
    expect(result.previousValue).toBeUndefined();
  });

  it("omits previousValue when only one observation is available", () => {
    const json = makeResponse([
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2023",
        value: 2.9,
        unit: "",
      },
    ]);

    const result = parseWorldBankIndicator(json, META);
    expect(result.previousValue).toBeUndefined();
  });

  it("throws WorldBankDataError when all observations are null", () => {
    const json = makeResponse([
      {
        indicator: { id: "x", value: "x" },
        country: { id: "US", value: "United States" },
        countryiso3code: "USA",
        date: "2023",
        value: null,
        unit: "",
      },
    ]);
    expect(() => parseWorldBankIndicator(json, META)).toThrow(WorldBankDataError);
  });

  it("throws WorldBankDataError for an API error response (invalid country/indicator)", () => {
    const errorResponse = [
      { message: [{ id: "120", key: "Invalid value", value: "The provided parameter value is not valid" }] },
    ];
    expect(() => parseWorldBankIndicator(errorResponse, META)).toThrow(WorldBankDataError);
  });

  it("throws WorldBankDataError for a completely malformed response", () => {
    expect(() => parseWorldBankIndicator(null, META)).toThrow(WorldBankDataError);
    expect(() => parseWorldBankIndicator([], META)).toThrow(WorldBankDataError);
  });
});
