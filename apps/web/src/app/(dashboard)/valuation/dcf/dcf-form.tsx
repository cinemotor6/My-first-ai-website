"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DCFFieldsGrid } from "@/components/valuation/dcf-fields-grid";
import { DCF_DEFAULTS, type DCFFormState } from "@/lib/valuation/dcf-fields";
import { formatCurrency } from "@/lib/utils";
import type { DCFResult } from "@financeapp/shared-types";

export function DCFForm() {
  const [form, setForm] = useState<DCFFormState>(DCF_DEFAULTS);
  const [result, setResult] = useState<DCFResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof DCFFormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: key === "symbol" ? value : Number(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/valuation/dcf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <DCFFieldsGrid idPrefix="dcf" value={form} onChange={updateField} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Calculating..." : "Calculate fair value"}
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
              Submit the form to run a single-stage DCF via the Python quant service.
            </p>
          )}
          {result && (
            <div className="space-y-2 text-sm">
              <Row label="Fair value / share" value={formatCurrency(result.fairValuePerShare)} emphasize />
              <Row label="Enterprise value" value={formatCurrency(result.enterpriseValue)} />
              <Row label="Equity value" value={formatCurrency(result.equityValue)} />
              <Row label="PV of cash flows" value={formatCurrency(result.presentValueOfCashFlows)} />
              <Row label="PV of terminal value" value={formatCurrency(result.presentValueOfTerminalValue)} />
              <div className="pt-2">
                <div className="mb-1 text-xs uppercase text-muted-foreground">
                  Projected free cash flows
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.projectedFreeCashFlows.map((fcf, i) => (
                    <span key={i} className="rounded bg-muted px-2 py-1 text-xs">
                      Y{i + 1}: {formatCurrency(fcf)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "text-base font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
