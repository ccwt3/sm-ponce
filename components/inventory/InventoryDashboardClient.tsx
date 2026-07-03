"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import posthog from "posthog-js";

import { ConfirmDeleteDialog } from "@/components/inventory/ConfirmDeleteDialog";
import {
  EmptyInventoryState,
  EmptySearchState,
} from "@/components/inventory/EmptyState";
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
  const searchCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearch(query);
    if (searchCaptureTimer.current) clearTimeout(searchCaptureTimer.current);
    if (query.trim()) {
      searchCaptureTimer.current = setTimeout(() => {
        posthog.capture("inventory_searched", { query });
      }, 600);
    }
  };

  const handleOpenCreate = () => {
    posthog.capture("product_create_modal_opened");
    openCreate();
  };

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
              onChange={handleSearchChange}
              className={cn(inventoryForm.input, "w-52 pl-8 pr-3")}
            />
          </div>
          <button
            onClick={handleOpenCreate}
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

        {!loading && !error && products.length > 0 && (
          <ProductTable
            products={products}
            onEdit={openEdit}
            onRequestDelete={setProductToDelete}
          />
        )}

        {!loading && !error && products.length === 0 && !isSearchMode && (
          <EmptyInventoryState onAddFirst={handleOpenCreate} />
        )}

        {!loading &&
          !error &&
          products.length === 0 &&
          isSearchMode &&
          !isSearching && (
            <EmptySearchState onClearSearch={() => setSearch("")} />
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
