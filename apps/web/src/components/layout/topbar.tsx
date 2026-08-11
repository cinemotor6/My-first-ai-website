"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import { MobileNav } from "./mobile-nav";
import { SymbolSearch } from "./symbol-search";

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-3 sm:gap-4 sm:px-4">
      <MobileNav />
      <SymbolSearch />
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
