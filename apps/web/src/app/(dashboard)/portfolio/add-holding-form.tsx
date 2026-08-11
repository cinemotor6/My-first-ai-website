"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "HKD", "CNY"];

export function AddHoldingForm() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          quantity: Number(quantity),
          averageCost: Number(averageCost),
          currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not add holding.");
        return;
      }

      setSymbol("");
      setQuantity("");
      setAverageCost("");
      router.refresh();
    } catch {
      setError("Network error while adding the holding.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 border-b border-border p-4"
    >
      <div className="w-24 space-y-1">
        <Label htmlFor="add-symbol">Symbol</Label>
        <Input
          id="add-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="AAPL"
          required
        />
      </div>
      <div className="w-24 space-y-1">
        <Label htmlFor="add-quantity">Quantity</Label>
        <Input
          id="add-quantity"
          type="number"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="10"
          required
        />
      </div>
      <div className="w-28 space-y-1">
        <Label htmlFor="add-cost">Avg cost</Label>
        <Input
          id="add-cost"
          type="number"
          step="any"
          min="0"
          value={averageCost}
          onChange={(e) => setAverageCost(e.target.value)}
          placeholder="150.00"
          required
        />
      </div>
      <div className="w-24 space-y-1">
        <Label htmlFor="add-currency">Currency</Label>
        <select
          id="add-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="flex h-9 w-full rounded-md border border-border bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add holding"}
      </Button>
      {error && <p className="w-full text-sm text-down">{error}</p>}
    </form>
  );
}
