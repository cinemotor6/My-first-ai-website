import type { MacroIndicator } from "@financeapp/shared-types";

export interface MacroProvider {
  readonly name: string;
  getIndicators(region?: string): Promise<MacroIndicator[]>;
}
