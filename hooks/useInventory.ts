"use client";
//TODO : refactorizar a useProducts para ser más genérico y reutilizable al momento de cambiar el tipo de informacion de la bd
//TODO (ej: agregar una columna de "proveedor" sin tener que hardcodear todo el hook de nuevo)

import { useState, useEffect, useCallback } from "react";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ModalState,
} from "@/types";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api";

/**
 * Hook principal de la tabla de inventario.
 *
 * Encapsula:
 *  - Fetching de productos desde la API (📌 conecta a DB vía /api/products)
 *  - Estado local: búsqueda, modal, loading, error
 *  - Acciones CRUD con optimistic updates
 */
export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  // ── 📌 Carga inicial desde la base de datos ──────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts(); // llama a GET /api/products
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Búsqueda local (no requiere re-fetch) ────────────────────────────────
  const searchFields = ["nombre", "medida", "modelo", "tipo"] as const;
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return searchFields.some((field) => {
      // Pasa por cada campo relevante
      return String(p[field]).toLowerCase().includes(q);
    });
  });

  // ── 📌 Crear producto ────────────────────────────────────────────────────
  const handleCreate = async (input: CreateProductInput) => {
    try {
      const created = await createProduct(input); // POST /api/products → DB
      setProducts((prev) => [...prev, created]);
      setModal({ mode: "closed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    }
  };

  // ── 📌 Actualizar producto ───────────────────────────────────────────────
  const handleUpdate = async (input: UpdateProductInput) => {
    try {
      console.log(input);

      const updated = await updateProduct(input); // PUT /api/products/:id → DB
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setModal({ mode: "closed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  // ── 📌 Eliminar producto ─────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    // Optimistic update: eliminar de UI antes de confirmar en DB
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteProduct(id); // DELETE /api/products/:id → DB
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      fetchProducts(); // revertir si falla
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => setModal({ mode: "create" });
  const openEdit = (product: Product) => setModal({ mode: "edit", product });
  const closeModal = () => setModal({ mode: "closed" });

  return {
    // estado
    products: filteredProducts,
    totalProducts: products.length,
    search,
    setSearch,
    loading,
    error,
    modal,
    // acciones
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreate,
    openEdit,
    closeModal,
    refetch: fetchProducts,
  };
}
