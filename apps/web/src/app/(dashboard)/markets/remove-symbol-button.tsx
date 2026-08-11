"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RemoveSymbolButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not remove symbol.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-down">{error}</span>}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        disabled={removing}
        aria-label="Remove from watchlist"
        className="h-7 w-7"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
