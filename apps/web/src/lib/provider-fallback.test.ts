import { describe, expect, it, vi } from "vitest";
import { withFallback } from "./provider-fallback";

describe("withFallback", () => {
  it("returns the primary result when primary succeeds", async () => {
    const result = await withFallback(
      "test",
      async () => "live",
      async () => "mock",
    );
    expect(result).toBe("live");
  });

  it("falls back to the fallback result when primary throws", async () => {
    const result = await withFallback(
      "test",
      async () => {
        throw new Error("network down");
      },
      async () => "mock",
    );
    expect(result).toBe("mock");
  });

  it("falls back when primary rejects with a non-Error value", async () => {
    const result = await withFallback(
      "test",
      async () => {
        throw "boom";
      },
      async () => "mock",
    );
    expect(result).toBe("mock");
  });

  it("logs a warning when falling back", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await withFallback(
      "my-label",
      async () => {
        throw new Error("nope");
      },
      async () => "mock",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("my-label"),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });

  it("does not call fallback when primary succeeds", async () => {
    const fallbackFn = vi.fn(async () => "mock");
    await withFallback("test", async () => "live", fallbackFn);
    expect(fallbackFn).not.toHaveBeenCalled();
  });
});
