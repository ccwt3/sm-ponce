import { StockBadge } from "@/components/ui/StockBadge";
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
        <td key={field.name} className="px-3 py-3.5 text-brand-text-secondary">
          N/A
        </td>
      ); // omite este campo
    }

    if (field.type === 1) {
      return (
        <td
          key={field.name}
          className="px-3 py-3.5 font-medium text-brand-text-primary"
        >
          {product[field.name]}
        </td>
      );
    } else if (field.type === 2) {
      return (
        <td key={field.name} className="px-3 py-3.5 text-brand-text-primary">
          {formatPrice(product[field.name])}
        </td>
      );
    } else if (field.type === 3) {
      return (
        <td key={field.name} className="px-3 py-3.5">
          <StockBadge existencia={product[field.name]} />
        </td>
      );
    }

    return (
      <td key={field.name} className="px-3 py-3.5 text-brand-text-secondary">
        {product[field.name]}
      </td>
    );
  });

  return rowContent;
}
