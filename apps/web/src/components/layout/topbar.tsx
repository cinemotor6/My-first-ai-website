"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { authEnabled } from "@/lib/auth";

export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const symbol = query.trim().toUpperCase();
    if (symbol) router.push(`/stocks/${encodeURIComponent(symbol)}`);
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol, e.g. AAPL, SAP.DE, 7203.T"
          className="pl-8"
        />
      </form>
      <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Mock data mode</span>
        {authEnabled ? (
          <UserButton afterSignOutUrl="/sign-in" />
        ) : (
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in (not configured)
          </Link>
        )}
      </div>
    </header>
  );
}
