import type { HistogramBucket } from "@financeapp/shared-types";
import { formatCurrency } from "@/lib/utils";

/** Simple dependency-free bar-chart histogram, matching components/charts/line-chart.tsx. */
export function Histogram({ buckets }: { buckets: HistogramBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="flex h-40 items-end gap-px">
      {buckets.map((b, i) => (
        <div
          key={i}
          className="group relative flex-1 bg-primary/70 transition-colors hover:bg-primary"
          style={{ height: `${(b.count / maxCount) * 100}%` }}
          title={`${formatCurrency(b.rangeStart)} – ${formatCurrency(b.rangeEnd)}: ${b.count} draws`}
        />
      ))}
    </div>
  );
}
