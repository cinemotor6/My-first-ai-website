import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const DATA_MODE_LABELS: Record<string, string> = {
  mock: "Mock data mode",
  yahoo: "Live data (Yahoo Finance)",
  live: "Live data · mock fallback",
};

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  const providerKey = process.env.MARKET_DATA_PROVIDER?.trim() || "live";
  const dataModeLabel = DATA_MODE_LABELS[providerKey] ?? "Live data · mock fallback";

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      {/* min-w-0 stops this flex child from growing to fit wide content
          (e.g. tables) — without it, the whole page grows past 100vw
          instead of the table scrolling within its own container. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar dataModeLabel={dataModeLabel} />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
