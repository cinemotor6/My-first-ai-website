"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DCFFieldsGrid } from "@/components/valuation/dcf-fields-grid";
import { DCF_DEFAULTS, type DCFFormState } from "@/lib/valuation/dcf-fields";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ScenarioAnalysisResult } from "@financeapp/shared-types";

interface ScenarioRow {
  id: string;
  name: string;
  revenueGrowthRate: number;
  ebitMargin: number;
  discountRate: number;
}

// Fixed ids (not crypto.randomUUID()) for the two starter rows: this array
// is built during the initial render of a Client Component, which runs on
// both the server and the client. A random id would differ between the two
// passes and trigger a hydration mismatch. Rows added later via
// addScenario() run purely client-side (an event handler, post-hydration),
// so crypto.randomUUID() there is safe.
function defaultScenarios(base: DCFFormState): ScenarioRow[] {
  return [
    {
      id: "bull",
      name: "Bull",
      revenueGrowthRate: Number((base.revenueGrowthRate + 0.04).toFixed(4)),
      ebitMargin: Number((base.ebitMargin + 0.03).toFixed(4)),
      discountRate: base.discountRate,
    },
    {
      id: "bear",
      name: "Bear",
      revenueGrowthRate: Number(Math.max(base.revenueGrowthRate - 0.04, -0.4).toFixed(4)),
      ebitMargin: Number(Math.max(base.ebitMargin - 0.03, -0.9).toFixed(4)),
      discountRate: Number((base.discountRate + 0.01).toFixed(4)),
    },
  ];
}

export function ScenarioForm() {
  const [baseCase, setBaseCase] = useState<DCFFormState>(DCF_DEFAULTS);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>(() => defaultScenarios(DCF_DEFAULTS));
  const [result, setResult] = useState<ScenarioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateBaseCase(key: keyof DCFFormState, value: string) {
    setBaseCase((prev) => ({ ...prev, [key]: key === "symbol" ? value : Number(value) }));
  }

  function updateScenario(id: string, key: keyof Omit<ScenarioRow, "id">, value: string) {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: key === "name" ? value : Number(value) } : s)),
    );
  }

  function addScenario() {
    setScenarios((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Scenario ${prev.length + 1}`,
        revenueGrowthRate: baseCase.revenueGrowthRate,
        ebitMargin: baseCase.ebitMargin,
        discountRate: baseCase.discountRate,
      },
    ]);
  }

  function removeScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/valuation/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: baseCase.symbol,
          baseCase,
          scenarios: scenarios.map((s) => ({
            name: s.name,
            overrides: {
              revenueGrowthRate: s.revenueGrowthRate,
              ebitMargin: s.ebitMargin,
              discountRate: s.discountRate,
            },
          })),
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Base case</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DCFFieldsGrid idPrefix="sc-base" value={baseCase} onChange={updateBaseCase} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Scenarios</Label>
                <Button type="button" variant="outline" size="sm" onClick={addScenario}>
                  <Plus className="h-3.5 w-3.5" /> Add scenario
                </Button>
              </div>
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-2 gap-2 rounded-md border border-border p-3 sm:grid-cols-5 sm:items-end"
                >
                  <div className="space-y-1 sm:col-span-1">
                    <Label htmlFor={`sc-name-${s.id}`}>Name</Label>
                    <Input
                      id={`sc-name-${s.id}`}
                      value={s.name}
                      onChange={(e) => updateScenario(s.id, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`sc-growth-${s.id}`}>Revenue growth</Label>
                    <Input
                      id={`sc-growth-${s.id}`}
                      type="number"
                      step="0.01"
                      value={s.revenueGrowthRate}
                      onChange={(e) => updateScenario(s.id, "revenueGrowthRate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`sc-margin-${s.id}`}>EBIT margin</Label>
                    <Input
                      id={`sc-margin-${s.id}`}
                      type="number"
                      step="0.01"
                      value={s.ebitMargin}
                      onChange={(e) => updateScenario(s.id, "ebitMargin", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`sc-discount-${s.id}`}>Discount rate</Label>
                    <Input
                      id={`sc-discount-${s.id}`}
                      type="number"
                      step="0.01"
                      value={s.discountRate}
                      onChange={(e) => updateScenario(s.id, "discountRate", e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeScenario(s.id)}
                    aria-label={`Remove ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {scenarios.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add at least one scenario to compare against the base case.
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading || scenarios.length === 0}>
              {loading ? "Comparing..." : "Compare scenarios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-4 text-sm text-down">{error}</CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Fair value / share</TableHead>
                  <TableHead>vs. base case</TableHead>
                  <TableHead>Enterprise value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Base case</TableCell>
                  <TableCell>{formatCurrency(result.baseCase.fairValuePerShare)}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>{formatCurrency(result.baseCase.enterpriseValue)}</TableCell>
                </TableRow>
                {result.scenarios.map((s) => {
                  if (s.error || !s.result) {
                    return (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell colSpan={3} className="text-down">
                          {s.error || "Could not compute this scenario."}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  const delta =
                    ((s.result.fairValuePerShare - result.baseCase.fairValuePerShare) /
                      result.baseCase.fairValuePerShare) *
                    100;
                  return (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{formatCurrency(s.result.fairValuePerShare)}</TableCell>
                      <TableCell className={delta < 0 ? "text-down" : "text-up"}>
                        {formatPercent(delta)}
                      </TableCell>
                      <TableCell>{formatCurrency(s.result.enterpriseValue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
