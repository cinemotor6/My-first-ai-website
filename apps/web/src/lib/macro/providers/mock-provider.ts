import type { MacroIndicator } from "@financeapp/shared-types";
import type { MacroProvider } from "../types";

const MOCK_INDICATORS: MacroIndicator[] = [
  { id: "us-cpi", name: "CPI (YoY)", region: "United States", value: 2.9, unit: "%", period: "2026-07", previousValue: 3.0 },
  { id: "us-gdp", name: "GDP Growth (QoQ annualized)", region: "United States", value: 2.1, unit: "%", period: "Q2 2026", previousValue: 1.8 },
  { id: "us-unemployment", name: "Unemployment Rate", region: "United States", value: 4.1, unit: "%", period: "2026-07", previousValue: 4.0 },
  { id: "us-fedfunds", name: "Fed Funds Rate", region: "United States", value: 4.25, unit: "%", period: "2026-07", previousValue: 4.5 },
  { id: "ea-cpi", name: "CPI (YoY)", region: "Euro Area", value: 2.2, unit: "%", period: "2026-07", previousValue: 2.3 },
  { id: "ea-ecb-rate", name: "ECB Deposit Rate", region: "Euro Area", value: 2.75, unit: "%", period: "2026-07", previousValue: 3.0 },
  { id: "jp-cpi", name: "CPI (YoY)", region: "Japan", value: 2.6, unit: "%", period: "2026-07", previousValue: 2.8 },
  { id: "cn-gdp", name: "GDP Growth (YoY)", region: "China", value: 4.8, unit: "%", period: "Q2 2026", previousValue: 5.0 },
];

export class MockMacroProvider implements MacroProvider {
  readonly name = "mock";

  async getIndicators(region?: string): Promise<MacroIndicator[]> {
    if (!region) return MOCK_INDICATORS;
    return MOCK_INDICATORS.filter(
      (i) => i.region.toLowerCase() === region.toLowerCase(),
    );
  }
}
