import { StockBadge } from "@/components/ui/StockBadge";
import { inventoryTable } from "@/components/inventory/styles";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { databaseFields } from "@/lib/contentNormalizer";

//type 1 is for important fields
//type 0 is for normal fields
//type 2 is for numeric fields that need formatting (like price)
//type 3 is for stock that needs a badge (decoration)

export function RowInformation({ product }: { product: Product }) {
  const rowContent = databaseFields.map((field) => {
    if (product[field.name] === undefined || product[field.name] === null) {
      return (
        <td key={field.name} className={inventoryTable.cellSecondary}>
          N/A
        </td>
      ); // omite este campo
    }

    if (field.type === 1) {
      return (
        <td
          key={field.name}
          className={inventoryTable.cellEmphasis}
        >
          {product[field.name]}
        </td>
      );
    } else if (field.type === 2) {
      return (
        <td key={field.name} className={inventoryTable.cellPrimary}>
          {formatPrice(product[field.name])}
        </td>
      );
    } else if (field.type === 3) {
      return (
        <td key={field.name} className={inventoryTable.cell}>
          <StockBadge existencia={product[field.name]} />
        </td>
      );
    }

    return (
      <td key={field.name} className={inventoryTable.cellSecondary}>
        {product[field.name]}
      </td>
    );
  });

  return rowContent;
}
