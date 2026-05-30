"use client";

import { Search } from "lucide-react";

import { ProductModal } from "@/components/inventory/ProductModal";
import { ProductTable } from "@/components/inventory/ProductTable";
import { useInventory } from "@/hooks/useInventory";
import type { Product } from "@/types";

interface InventoryDashboardClientProps {
  initialError?: string | null;
  initialProducts: Product[];
}

export function InventoryDashboardClient({
  initialError = null,
  initialProducts,
}: InventoryDashboardClientProps) {
  const {
    products,
    search,
    setSearch,
    loading,
    error,
    modal,
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreate,
    openEdit,
    closeModal,
  } = useInventory({ initialError, initialProducts });

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
            />
            <input
              type="text"
              placeholder="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-52 rounded-md border border-brand-border bg-white py-2 pl-8 pr-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-black"
            />
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-brand-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-black-hover"
          >
            Agregar
          </button>
        </div>

        {loading && (
          <p className="py-12 text-center text-sm text-brand-text-muted">
            Cargando productos...
          </p>
        )}
        {error && (
          <p className="py-12 text-center text-sm text-brand-danger">{error}</p>
        )}

        {!loading && !error && (
          <ProductTable
            products={products}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      <ProductModal
        modal={modal}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
