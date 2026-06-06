import { StockBadge } from "@/components/ui/StockBadge";
import { inventoryTable } from "@/components/inventory/styles";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import { productTableColumns } from "@/lib/contentNormalizer";

function emptyCell(key: string) {
  return (
    <td key={key} className={inventoryTable.cellSecondary}>
      No disponible
    </td>
  );
}

export function RowInformation({ product }: { product: Product }) {
  const rowContent = productTableColumns.map((column) => {
    const value = product[column.key];

    if (value === undefined || value === null) {
      return emptyCell(column.key);
    }

    if (column.kind === "emphasis") {
      return (
        <td
          key={column.key}
          className={inventoryTable.cellEmphasis}
        >
          {value}
        </td>
      );
    }

    if (column.kind === "price") {
      return (
        <td key={column.key} className={inventoryTable.cellPrimary}>
          {formatPrice(Number(value))}
        </td>
      );
    }

    if (column.kind === "stock") {
      return (
        <td key={column.key} className={inventoryTable.cell}>
          <StockBadge existencia={Number(value)} />
        </td>
      );
    }

    return (
      <td key={column.key} className={inventoryTable.cellSecondary}>
        {value}
      </td>
    );
  });

  return rowContent;
}
