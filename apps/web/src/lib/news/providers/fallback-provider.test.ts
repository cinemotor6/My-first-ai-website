import { describe, expect, it, vi } from "vitest";
import { FallbackNewsProvider } from "./fallback-provider";
import type { NewsProvider } from "../types";
import type { NewsArticle } from "@financeapp/shared-types";

const LIVE_ARTICLE: NewsArticle = {
  id: "1",
  headline: "Live headline",
  source: "Reuters",
  url: "https://example.com",
  publishedAt: "2026-01-01T00:00:00.000Z",
  relatedSymbols: ["AAPL"],
};
const MOCK_ARTICLE: NewsArticle = { ...LIVE_ARTICLE, id: "mock-1", headline: "Mock headline" };

describe("FallbackNewsProvider", () => {
  it("returns live articles when the primary succeeds", async () => {
    const primary: NewsProvider = {
      name: "live",
      getLatest: vi.fn().mockResolvedValue([LIVE_ARTICLE]),
      getForSymbol: vi.fn().mockResolvedValue([LIVE_ARTICLE]),
    };
    const fallback: NewsProvider = {
      name: "mock",
      getLatest: vi.fn().mockResolvedValue([MOCK_ARTICLE]),
      getForSymbol: vi.fn().mockResolvedValue([MOCK_ARTICLE]),
    };
    const provider = new FallbackNewsProvider(primary, fallback);

    expect(await provider.getLatest(5)).toEqual([LIVE_ARTICLE]);
    expect(fallback.getLatest).not.toHaveBeenCalled();
  });

  it("falls back to mock articles when the primary throws", async () => {
    const primary: NewsProvider = {
      name: "live",
      getLatest: vi.fn().mockRejectedValue(new Error("network down")),
      getForSymbol: vi.fn().mockRejectedValue(new Error("network down")),
    };
    const fallback: NewsProvider = {
      name: "mock",
      getLatest: vi.fn().mockResolvedValue([MOCK_ARTICLE]),
      getForSymbol: vi.fn().mockResolvedValue([MOCK_ARTICLE]),
    };
    const provider = new FallbackNewsProvider(primary, fallback);

    expect(await provider.getLatest()).toEqual([MOCK_ARTICLE]);
    expect(await provider.getForSymbol("AAPL")).toEqual([MOCK_ARTICLE]);
  });
});
