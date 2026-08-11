"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
            {item.children && active && (
              <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname === child.href
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
