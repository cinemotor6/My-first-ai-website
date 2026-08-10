import type { HistoricalBar } from "@financeapp/shared-types";

/**
 * Minimal dependency-free SVG line chart. Enough to visualize price history
 * for the foundation phase. Swap for TradingView Lightweight Charts (or
 * similar) once the app has real historical data and needs interactivity
 * (zoom, crosshair, multiple series).
 */
export function LineChart({
  bars,
  width = 640,
  height = 220,
}: {
  bars: HistoricalBar[];
  width?: number;
  height?: number;
}) {
  if (bars.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const closes = bars.map((b) => b.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const padding = 8;

  const points = bars.map((bar, i) => {
    const x = padding + (i / (bars.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((bar.close - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const isUp = closes[closes.length - 1] >= closes[0];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={isUp ? "var(--up)" : "var(--down)"}
        strokeWidth={1.5}
      />
    </svg>
  );
}
