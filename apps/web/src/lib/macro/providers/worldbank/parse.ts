import type { MacroIndicator } from "@financeapp/shared-types";
import type { WorldBankObservation } from "./types";

export class WorldBankDataError extends Error {}

export interface WorldBankIndicatorMeta {
  id: string;
  name: string;
  region: string;
  unit: string;
}

/**
 * `json` is typed `unknown` rather than `WorldBankResponse` because this is
 * an external API boundary — the whole point of this function is to
 * validate the shape defensively rather than trust it.
 */
export function parseWorldBankIndicator(json: unknown, meta: WorldBankIndicatorMeta): MacroIndicator {
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    const errorPayload = Array.isArray(json) ? (json[0] as { message?: { value?: string }[] }) : undefined;
    const message = errorPayload?.message?.[0]?.value;
    throw new WorldBankDataError(
      message
        ? `World Bank error for ${meta.id}: ${message}`
        : `Unexpected World Bank response shape for ${meta.id}.`,
    );
  }

  const observations = (json[1] as WorldBankObservation[])
    .filter((o): o is WorldBankObservation & { value: number } => o.value !== null)
    .sort((a, b) => Number(b.date) - Number(a.date));

  if (observations.length === 0) {
    throw new WorldBankDataError(`No data available for ${meta.id} (${meta.region}).`);
  }

  const [latest, previous] = observations;

  return {
    id: meta.id,
    name: meta.name,
    region: meta.region,
    value: round2(latest.value),
    unit: meta.unit,
    period: latest.date,
    previousValue: previous ? round2(previous.value) : undefined,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
