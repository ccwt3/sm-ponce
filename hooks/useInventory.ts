"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/lib/api";

import type {
  CreateProductInput,
  ModalState,
  Product,
  UpdateProductInput,
} from "@/types";

interface UseInventoryOptions {
  initialError?: string | null;
  initialProducts?: Product[];
}

const searchFields = ["nombre", "medida", "modelo", "tipo_id"] as const;

export function useInventory({
  initialError = null,
  initialProducts,
}: UseInventoryOptions = {}) {
  const hasInitialProducts = initialProducts !== undefined;
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!hasInitialProducts && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialProducts && !initialError) {
      fetchProducts();
    }
  }, [fetchProducts, hasInitialProducts, initialError]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      searchFields.some((field) =>
        String(product[field]).toLowerCase().includes(query),
      ),
    );
  }, [products, search]);

  const handleCreate = async (input: CreateProductInput) => {
    try {
      setError(null);
      const created = await createProduct(input);
      setProducts((prev) => [...prev, created]);
      setModal({ mode: "closed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    }
  };

  const handleUpdate = async (input: UpdateProductInput) => {
    try {
      setError(null);
      const updated = await updateProduct(input);
      setProducts((prev) =>
        prev.map((product) => (product.id === updated.id ? updated : product)),
      );
      setModal({ mode: "closed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    const previousProducts = products;

    setError(null);
    setProducts((prev) => prev.filter((product) => product.id !== id));

    try {
      await deleteProduct(id);
    } catch (err) {
      setProducts(previousProducts);
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const openCreate = () => setModal({ mode: "create" });
  const openEdit = (product: Product) => setModal({ mode: "edit", product });
  const closeModal = () => setModal({ mode: "closed" });

  return {
    products: filteredProducts,
    totalProducts: products.length,
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
    refetch: fetchProducts,
  };
}
