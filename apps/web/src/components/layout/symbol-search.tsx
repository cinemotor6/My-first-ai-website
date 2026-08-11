"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CompanyProfile } from "@financeapp/shared-types";

export function SymbolSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(trimmed)}`, {
          // Aborts on whichever comes first: a new keystroke (debounce
          // cleanup below) or 8s of no response, so a hung request can't
          // leave the dropdown stuck loading indefinitely.
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)]),
        });
        if (!res.ok) return;
        const data: CompanyProfile[] = await res.json();
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        // Ignore aborted/failed lookups; the user can still press Enter to
        // navigate directly to a symbol.
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSymbol(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      goToSymbol(results[activeIndex].symbol);
      return;
    }
    const symbol = query.trim().toUpperCase();
    if (symbol) goToSymbol(symbol);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search symbol, e.g. AAPL, SAP.DE, 7203.T"
          className="pl-8"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </form>

      {open && query.trim().length > 0 && results.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-md">
          {results.map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                onClick={() => goToSymbol(r.symbol)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  i === activeIndex ? "bg-muted" : ""
                }`}
              >
                <span className="font-medium">{r.symbol}</span>
                <span className="truncate pl-3 text-muted-foreground">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
