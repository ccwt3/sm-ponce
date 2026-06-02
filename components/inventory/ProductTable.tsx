import type { Product } from "@/types";
import { RowInformation } from "@/components/inventory/ProductTableRows";
import {
  inventoryButton,
  inventoryState,
  inventoryTable,
} from "@/components/inventory/styles";
import { productTableColumns } from "@/lib/contentNormalizer";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const editedFields = [
  ...productTableColumns,
  { key: "actions", label: "Acciones", kind: "actions" },
] as const;

export function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className={inventoryState.empty}>
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {editedFields.map((col) => (
              <th
                key={col.key}
                className={inventoryTable.heading}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className={inventoryTable.row}
            >
              <RowInformation product={product} />

              <td className={inventoryTable.cell}>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className={inventoryButton.table}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className={inventoryButton.dangerTable}
                  >
                    Borrar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
