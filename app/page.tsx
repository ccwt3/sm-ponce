"use client";

import { Search } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { ProductTable } from "@/components/inventory/ProductTable";
import { ProductModal } from "@/components/inventory/ProductModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function InventoryPage() {
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
  } = useInventory(); // 📌 toda la lógica y fetching de DB vive en el hook

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar
        onSettings={() => console.log("→ ir a configuración")}
        onLogout={() => console.log("→ cerrar sesión")}
      />

      <main className="flex-1 p-6">
        {/* Barra de acciones */}
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
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-brand-border bg-white py-2 pl-8 pr-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-black w-52"
            />
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-brand-black px-5 py-2 text-sm font-medium text-white hover:bg-brand-black-hover transition-colors"
          >
            Agregar
          </button>
        </div>

        {/* Estados de carga / error */}
        {loading && (
          <p className="py-12 text-center text-sm text-brand-text-muted">
            Cargando productos…
          </p>
        )}
        {error && (
          <p className="py-12 text-center text-sm text-brand-danger">{error}</p>
        )}

        {/* Tabla principal */}
        {!loading && !error && (
          <ProductTable
            products={products}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      <Footer />

      {/* Modal crear / editar */}
      <ProductModal
        modal={modal}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
