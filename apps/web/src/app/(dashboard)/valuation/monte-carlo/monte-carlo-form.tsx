"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DCFFieldsGrid } from "@/components/valuation/dcf-fields-grid";
import { Histogram } from "@/components/charts/histogram";
import { DCF_DEFAULTS, type DCFFormState } from "@/lib/valuation/dcf-fields";
import { formatCurrency } from "@/lib/utils";
import type { MonteCarloResult } from "@financeapp/shared-types";

const SIMULATION_DEFAULTS = {
  iterations: 5000,
  revenueGrowthStdDev: 0.04,
  discountRateStdDev: 0.015,
};

export function MonteCarloForm() {
  const [baseCase, setBaseCase] = useState<DCFFormState>(DCF_DEFAULTS);
  const [sim, setSim] = useState(SIMULATION_DEFAULTS);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateBaseCase(key: keyof DCFFormState, value: string) {
    setBaseCase((prev) => ({ ...prev, [key]: key === "symbol" ? value : Number(value) }));
  }

  function updateSim(key: keyof typeof SIMULATION_DEFAULTS, value: string) {
    setSim((prev) => ({ ...prev, [key]: Number(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/valuation/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: baseCase.symbol,
          baseCase,
          ...sim,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error while contacting the valuation service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Base case + simulation settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <DCFFieldsGrid idPrefix="mc" value={baseCase} onChange={updateBaseCase} />

            <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-2 sm:gap-2">
              <Label htmlFor="mc-iterations">Iterations</Label>
              <Input
                id="mc-iterations"
                type="number"
                min={100}
                max={100_000}
                step={100}
                value={sim.iterations}
                onChange={(e) => updateSim("iterations", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-2 sm:gap-2">
              <Label htmlFor="mc-growth-std">Revenue growth std dev</Label>
              <Input
                id="mc-growth-std"
                type="number"
                step="0.005"
                min={0}
                max={1}
                value={sim.revenueGrowthStdDev}
                onChange={(e) => updateSim("revenueGrowthStdDev", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-2 sm:gap-2">
              <Label htmlFor="mc-discount-std">Discount rate std dev</Label>
              <Input
                id="mc-discount-std"
                type="number"
                step="0.005"
                min={0}
                max={1}
                value={sim.discountRateStdDev}
                onChange={(e) => updateSim("discountRateStdDev", e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Simulating..." : "Run simulation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-down">{error}</p>}
          {!error && !result && (
            <p className="text-sm text-muted-foreground">
              Run the simulation to see the distribution of fair value per share across
              {" "}{sim.iterations.toLocaleString()} randomized draws.
            </p>
          )}
          {result && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">
                  Median fair value / share
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(result.medianFairValue)}
                </div>
              </div>
              <Histogram buckets={result.histogram} />
              <div className="space-y-1">
                <Row label="Mean" value={formatCurrency(result.meanFairValue)} />
                <Row label="Std dev" value={formatCurrency(result.stdDev)} />
                <Row label="Min" value={formatCurrency(result.minValue)} />
                <Row label="Max" value={formatCurrency(result.maxValue)} />
                <Row label="5th percentile" value={formatCurrency(result.percentile5)} />
                <Row label="25th percentile" value={formatCurrency(result.percentile25)} />
                <Row label="75th percentile" value={formatCurrency(result.percentile75)} />
                <Row label="95th percentile" value={formatCurrency(result.percentile95)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
