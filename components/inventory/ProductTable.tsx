"use client";

import type { Product } from "@/types";
import { StockBadge } from "@/components/ui/StockBadge";
import { formatPrice } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-brand-text-muted">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-brand-border">
            {["Nombre", "Modelo", "Medida", "Tipo", "Existencia", "Precio proveedor", "Precio público", "Acciones"].map(
              (col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left text-xs font-normal text-brand-text-secondary"
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-brand-border last:border-0 hover:bg-brand-surface transition-colors"
            >
              <td className="px-3 py-3.5 font-medium text-brand-text-primary">
                {product.nombre}
              </td>
              <td className="px-3 py-3.5 text-brand-text-secondary">{product.modelo}</td>
              <td className="px-3 py-3.5 text-brand-text-secondary">
                {product.medida || "—"}
              </td>
              <td className="px-3 py-3.5 text-brand-text-secondary">{product.tipo}</td>
              <td className="px-3 py-3.5">
                <StockBadge existencia={product.existencia} />
              </td>
              <td className="px-3 py-3.5 text-brand-text-primary">
                {formatPrice(product.precioProveedor)}
              </td>
              <td className="px-3 py-3.5 text-brand-text-primary">
                {formatPrice(product.precioPublico)}
              </td>
              <td className="px-3 py-3.5">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="rounded border border-brand-border px-3 py-1 text-xs text-brand-text-primary hover:bg-brand-surface transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="rounded border border-brand-danger-border px-3 py-1 text-xs text-brand-danger hover:bg-brand-danger-hover-bg transition-colors"
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
