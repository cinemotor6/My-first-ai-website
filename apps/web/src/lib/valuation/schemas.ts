import { z } from "zod";

/**
 * Mirrors apps/quant-api/app/schemas.py::DCFInput. Keep in sync manually for
 * now; if the two schemas drift, generate one from the other later (e.g.
 * OpenAPI codegen from the FastAPI service).
 */
export const dcfInputSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  currentRevenue: z.number().positive(),
  revenueGrowthRate: z.number().min(-0.5).max(1),
  ebitMargin: z.number().min(-1).max(1),
  taxRate: z.number().min(0).max(0.6),
  discountRate: z.number().min(0.01).max(0.5),
  terminalGrowthRate: z.number().min(-0.05).max(0.1),
  projectionYears: z.number().int().min(1).max(15),
  sharesOutstanding: z.number().positive(),
  netDebt: z.number(),
});

export type DCFInputPayload = z.infer<typeof dcfInputSchema>;
