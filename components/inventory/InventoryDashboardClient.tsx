"use client";

import { Search } from "lucide-react";

import { ProductModal } from "@/components/inventory/ProductModal";
import { ProductTable } from "@/components/inventory/ProductTable";
import {
  inventoryButton,
  inventoryForm,
  inventoryState,
} from "@/components/inventory/styles";
import { useInventory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";
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
              className={cn(inventoryForm.input, "w-52 pl-8 pr-3")}
            />
          </div>
          <button
            onClick={openCreate}
            className={inventoryButton.primary}
          >
            Agregar
          </button>
        </div>

        {loading && (
          <p className={inventoryState.loading}>
            Cargando productos...
          </p>
        )}
        {error && (
          <p className={inventoryState.error}>{error}</p>
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
