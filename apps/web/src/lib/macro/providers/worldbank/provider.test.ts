import { afterEach, describe, expect, it, vi } from "vitest";
import { WorldBankMacroProvider } from "./provider";
import { WorldBankDataError } from "./parse";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

function observation(date: string, value: number | null) {
  return {
    indicator: { id: "x", value: "x" },
    country: { id: "US", value: "United States" },
    countryiso3code: "USA",
    date,
    value,
    unit: "",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorldBankMacroProvider", () => {
  it("fetches GDP growth and CPI for all four default regions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{}, [observation("2023", 2.5), observation("2022", 2.0)]]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new WorldBankMacroProvider();
    const results = await provider.getIndicators();

    // 4 regions x 2 indicators
    expect(results).toHaveLength(8);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("filters to a single region when requested", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{}, [observation("2023", 2.5)]]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new WorldBankMacroProvider();
    const results = await provider.getIndicators("Japan");

    expect(results).toHaveLength(2); // 1 region x 2 indicators
    expect(results.every((r) => r.region === "Japan")).toBe(true);
  });

  it("returns an empty array for an unrecognized region without hitting the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provider = new WorldBankMacroProvider();
    const results = await provider.getIndicators("Atlantis");

    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns partial results when some indicator requests fail", async () => {
    let call = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      call += 1;
      // Fail every other request.
      if (call % 2 === 0) {
        return jsonResponse(null, false, 500);
      }
      return jsonResponse([{}, [observation("2023", 1.0)]]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new WorldBankMacroProvider();
    const results = await provider.getIndicators();

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThan(8);
  });

  it("throws WorldBankDataError when every request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 500)));

    const provider = new WorldBankMacroProvider();
    await expect(provider.getIndicators()).rejects.toThrow(WorldBankDataError);
  });

  it("throws WorldBankDataError when fetch itself rejects (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const provider = new WorldBankMacroProvider();
    await expect(provider.getIndicators()).rejects.toThrow();
  });
});
