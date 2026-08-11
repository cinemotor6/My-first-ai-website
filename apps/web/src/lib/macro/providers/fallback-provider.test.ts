import { describe, expect, it, vi } from "vitest";
import { FallbackMacroProvider } from "./fallback-provider";
import type { MacroProvider } from "../types";
import type { MacroIndicator } from "@financeapp/shared-types";

const LIVE: MacroIndicator = {
  id: "us-gdp",
  name: "GDP Growth",
  region: "United States",
  value: 2.5,
  unit: "%",
  period: "2023",
};
const MOCK: MacroIndicator = { ...LIVE, id: "mock-us-gdp", value: 2.1 };

describe("FallbackMacroProvider", () => {
  it("returns live indicators when the primary succeeds", async () => {
    const primary: MacroProvider = { name: "live", getIndicators: vi.fn().mockResolvedValue([LIVE]) };
    const fallback: MacroProvider = { name: "mock", getIndicators: vi.fn().mockResolvedValue([MOCK]) };
    const provider = new FallbackMacroProvider(primary, fallback);

    expect(await provider.getIndicators()).toEqual([LIVE]);
    expect(fallback.getIndicators).not.toHaveBeenCalled();
  });

  it("falls back to mock indicators when the primary throws", async () => {
    const primary: MacroProvider = {
      name: "live",
      getIndicators: vi.fn().mockRejectedValue(new Error("network down")),
    };
    const fallback: MacroProvider = { name: "mock", getIndicators: vi.fn().mockResolvedValue([MOCK]) };
    const provider = new FallbackMacroProvider(primary, fallback);

    expect(await provider.getIndicators("United States")).toEqual([MOCK]);
    expect(fallback.getIndicators).toHaveBeenCalledWith("United States");
  });
});
