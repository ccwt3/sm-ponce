import type { StockStatus } from "@/types";
import { cn, getStockStatus } from "@/lib/utils";

interface StockBadgeProps {
  existencia: number | string;
}

const stockBadgeClasses: Record<StockStatus, string> = {
  ok: "bg-brand-stock-ok-bg text-brand-stock-ok-text",
  low: "bg-brand-stock-low-bg text-brand-stock-low-text",
  empty: "bg-brand-stock-empty-bg text-brand-stock-empty-text",
};

export function StockBadge({ existencia }: StockBadgeProps) {
  const numericExistencia = Number(existencia);
  const safeExistencia = Number.isFinite(numericExistencia)
    ? numericExistencia
    : 0;
  const status = getStockStatus(safeExistencia);

  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium",
        stockBadgeClasses[status],
      )}
    >
      {safeExistencia}
    </span>
  );
}
