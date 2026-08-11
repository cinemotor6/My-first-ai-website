"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddSymbolForm() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not add symbol.");
        return;
      }

      setSymbol("");
      router.refresh();
    } catch {
      setError("Network error while adding the symbol.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 border-b border-border p-4"
    >
      <div className="w-32 space-y-1">
        <Label htmlFor="add-watchlist-symbol">Symbol</Label>
        <Input
          id="add-watchlist-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="TSLA"
          required
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add to watchlist"}
      </Button>
      {error && <p className="w-full text-sm text-down">{error}</p>}
    </form>
  );
}
