import type { StockLevel } from "../../lib/landing/showcase-data";

const STOCK_LEVEL_STYLES: Record<StockLevel, string> = {
  ok: "bg-brand-stock-ok-bg text-brand-stock-ok-text",
  low: "bg-brand-stock-low-bg text-brand-stock-low-text",
  empty: "bg-brand-stock-empty-bg text-brand-stock-empty-text",
};

interface StockBadgeProps {
  level: StockLevel;
  value: number;
}

export function StockBadge({ level, value }: StockBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 min-w-[30px] items-center justify-center rounded-full px-2 font-mono text-xs font-bold ${STOCK_LEVEL_STYLES[level]}`}
    >
      {value}
    </span>
  );
}
