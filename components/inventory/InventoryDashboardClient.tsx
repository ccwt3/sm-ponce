"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/inventory/ConfirmDeleteDialog";
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
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const closeDeleteDialog = () => {
    setProductToDelete(null);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) {
      return;
    }

    setIsDeletingProduct(true);

    try {
      await handleDelete(productToDelete.id);
      closeDeleteDialog();
    } finally {
      setIsDeletingProduct(false);
    }
  };

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
            onRequestDelete={setProductToDelete}
          />
        )}
      </main>

      <ConfirmDeleteDialog
        open={productToDelete !== null}
        entityLabel="producto"
        itemName={productToDelete?.nombre ?? ""}
        isDeleting={isDeletingProduct}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
        onConfirm={confirmDeleteProduct}
      />

      <ProductModal
        modal={modal}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
