/**
 * Runs `primary` (a live/network-backed data source) and, on any failure —
 * network error, non-2xx response, unexpected/malformed payload — falls
 * back to `fallback` (the mock provider) instead of surfacing the error to
 * the caller or crashing the page. The failure is logged server-side so a
 * persistently-down live provider is visible in server logs rather than
 * silently masked forever.
 */
export async function withFallback<T>(
  label: string,
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    console.warn(
      `[provider-fallback] ${label} failed, falling back to mock data:`,
      err instanceof Error ? err.message : err,
    );
    return fallback();
  }
}
