import { describe, expect, it, vi } from "vitest";
import { FallbackFxRateProvider } from "./fallback-provider";
import type { FxRateProvider } from "../types";

describe("FallbackFxRateProvider", () => {
  it("returns the primary's rate when it succeeds", async () => {
    const primary: FxRateProvider = { name: "live", getRate: vi.fn().mockResolvedValue(0.93) };
    const fallback: FxRateProvider = { name: "mock", getRate: vi.fn().mockResolvedValue(0.9) };
    const provider = new FallbackFxRateProvider(primary, fallback);

    const rate = await provider.getRate("USD", "EUR");

    expect(rate).toBe(0.93);
    expect(fallback.getRate).not.toHaveBeenCalled();
  });

  it("falls back to the mock rate when the primary throws", async () => {
    const primary: FxRateProvider = {
      name: "live",
      getRate: vi.fn().mockRejectedValue(new Error("network down")),
    };
    const fallback: FxRateProvider = { name: "mock", getRate: vi.fn().mockResolvedValue(0.9) };
    const provider = new FallbackFxRateProvider(primary, fallback);

    const rate = await provider.getRate("USD", "EUR");

    expect(rate).toBe(0.9);
  });
});
