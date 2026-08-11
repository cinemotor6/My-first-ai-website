/**
 * World Bank API v2 response shape (partial — only the fields we read).
 * Successful responses are a 2-element tuple: [pagingMetadata, observations].
 * Error responses (bad country/indicator code) collapse to a 1-element
 * array with a `message` field instead — handled defensively in parse.ts
 * rather than assumed away.
 */
export interface WorldBankObservation {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
}

export type WorldBankResponse =
  | [unknown, WorldBankObservation[]]
  | [{ message?: { id?: string; key?: string; value?: string }[] }];
