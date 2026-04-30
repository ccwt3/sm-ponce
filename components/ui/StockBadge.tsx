import { getStockStatus, stockBadgeClasses } from "@/lib/utils";

interface StockBadgeProps {
  existencia: number;
}

export function StockBadge({ existencia }: StockBadgeProps) {
  const status = getStockStatus(existencia);
  const classes = stockBadgeClasses[status];

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full text-[13px] font-medium ${classes}`}
    >
      {existencia}
    </span>
  );
}
