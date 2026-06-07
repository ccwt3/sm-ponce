"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/inventory/ConfirmDeleteDialog";
import { FloatingErrorNotice } from "@/components/inventory/FloatingErrorNotice";
import { ProductModal } from "@/components/inventory/ProductModal";
import { ProductPagination } from "@/components/inventory/ProductPagination";
import { ProductSearchStatus } from "@/components/inventory/ProductSearchStatus";
import { ProductTable } from "@/components/inventory/ProductTable";
import {
  inventoryButton,
  inventoryForm,
  inventoryState,
} from "@/components/inventory/styles";
import { useInventory } from "@/hooks/useInventory";
import { MAX_PRODUCT_SEARCH_LENGTH } from "@/lib/products.search";
import { cn } from "@/lib/utils";
import type { Product, ProductPage } from "@/types";

interface InventoryDashboardClientProps {
  initialError?: string | null;
  initialPage: ProductPage;
}

export function InventoryDashboardClient({
  initialError = null,
  initialPage,
}: InventoryDashboardClientProps) {
  const {
    products,
    page,
    hasNextPage,
    showPagination,
    search,
    setSearch,
    isSearchMode,
    isSearching,
    isShowingLocalSearchResults,
    searchError,
    loading,
    paginationLoading,
    error,
    actionError,
    modal,
    handleCreate,
    handleUpdate,
    handleDelete,
    showActionError,
    dismissActionError,
    openCreate,
    openEdit,
    closeModal,
    goToPreviousPage,
    goToNextPage,
  } = useInventory({ initialError, initialPage });
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
      <FloatingErrorNotice
        message={actionError}
        onDismiss={dismissActionError}
      />

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
              maxLength={MAX_PRODUCT_SEARCH_LENGTH}
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
            emptyMessage={
              isShowingLocalSearchResults
                ? "No hay coincidencias en las paginas cargadas."
                : undefined
            }
            products={products}
            onEdit={openEdit}
            onRequestDelete={setProductToDelete}
          />
        )}

        <ProductSearchStatus
          error={searchError}
          isSearching={isSearching}
          isSearchMode={isSearchMode}
          isShowingLocalResults={isShowingLocalSearchResults}
        />

        {!error && showPagination && (
          <ProductPagination
            ariaLabel={
              isSearchMode
                ? "Paginacion de resultados de busqueda"
                : "Paginacion de productos"
            }
            page={page}
            hasNextPage={hasNextPage}
            loading={paginationLoading}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
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
        onValidationError={showActionError}
      />
    </>
  );
}
