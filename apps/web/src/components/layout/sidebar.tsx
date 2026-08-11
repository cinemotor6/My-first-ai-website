import { LineChart } from "lucide-react";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <LineChart className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight">Global Finance</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <NavLinks />
      </nav>
    </aside>
  );
}
