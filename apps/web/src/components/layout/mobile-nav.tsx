"use client";

import { useEffect, useState } from "react";
import { Menu, X, LineChart } from "lucide-react";
import { NavLinks } from "./nav-links";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <LineChart className="h-5 w-5" />
                Global Finance
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
