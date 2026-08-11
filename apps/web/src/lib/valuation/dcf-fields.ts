export const DCF_DEFAULTS = {
  symbol: "AAPL",
  currentRevenue: 400_000_000_000,
  revenueGrowthRate: 0.08,
  ebitMargin: 0.3,
  taxRate: 0.21,
  discountRate: 0.09,
  terminalGrowthRate: 0.025,
  projectionYears: 5,
  sharesOutstanding: 15_000_000_000,
  netDebt: 50_000_000_000,
};

export type DCFFormState = typeof DCF_DEFAULTS;

export const DCF_FIELDS: { key: keyof DCFFormState; label: string; step?: string }[] = [
  { key: "symbol", label: "Symbol" },
  { key: "currentRevenue", label: "Current revenue" },
  { key: "revenueGrowthRate", label: "Revenue growth rate (decimal)", step: "0.01" },
  { key: "ebitMargin", label: "EBIT margin (decimal)", step: "0.01" },
  { key: "taxRate", label: "Tax rate (decimal)", step: "0.01" },
  { key: "discountRate", label: "Discount rate / WACC (decimal)", step: "0.01" },
  { key: "terminalGrowthRate", label: "Terminal growth rate (decimal)", step: "0.001" },
  { key: "projectionYears", label: "Projection years" },
  { key: "sharesOutstanding", label: "Shares outstanding" },
  { key: "netDebt", label: "Net debt" },
];
