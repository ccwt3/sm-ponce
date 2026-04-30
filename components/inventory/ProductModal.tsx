"use client";

import { useState, useEffect } from "react";
import type { ModalState, CreateProductInput, UpdateProductInput } from "@/types";

interface ProductModalProps {
  modal: ModalState;
  onClose: () => void;
  onCreate: (input: CreateProductInput) => Promise<void>;
  onUpdate: (input: UpdateProductInput) => Promise<void>;
}

const EMPTY_FORM: CreateProductInput = {
  nombre: "",
  modelo: "",
  medida: "",
  tipo: "",
  existencia: 0,
  precioProveedor: 0,
  precioPublico: 0,
};

export function ProductModal({ modal, onClose, onCreate, onUpdate }: ProductModalProps) {
  const [form, setForm] = useState<CreateProductInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = modal.mode === "edit";

  // Precarga datos al abrir en modo edición
  useEffect(() => {
    if (isEdit && modal.product) {
      const { id, creadoEn, actualizadoEn, ...rest } = modal.product;
      setForm(rest);
    } else {
      setForm(EMPTY_FORM);
    }
  }, [modal]);

  if (modal.mode === "closed") return null;

  const handleChange = (key: keyof CreateProductInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (isEdit && modal.product) {
        await onUpdate({ id: modal.product.id, ...form });
      } else {
        await onCreate(form);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-black";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-16 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md animate-modal-in rounded-lg border border-brand-border bg-white p-6 shadow-modal">
        <h2 className="mb-5 text-base font-medium text-brand-text-primary">
          {isEdit ? "Editar producto" : "Agregar producto"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Nombre — fila completa */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-brand-text-secondary">Nombre</label>
            <input
              className={inputClass}
              placeholder="Ej. Cámara de seguridad"
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Modelo</label>
            <input
              className={inputClass}
              placeholder="CS-400X"
              value={form.modelo}
              onChange={(e) => handleChange("modelo", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Medida</label>
            <input
              className={inputClass}
              placeholder='1/2"'
              value={form.medida}
              onChange={(e) => handleChange("medida", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Tipo</label>
            <input
              className={inputClass}
              placeholder="Domo / Red / Grabador…"
              value={form.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Existencia</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.existencia}
              onChange={(e) => handleChange("existencia", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">
              Precio proveedor
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.precioProveedor}
              onChange={(e) => handleChange("precioProveedor", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">
              Precio público
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.precioPublico}
              onChange={(e) => handleChange("precioPublico", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-brand-border px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nombre.trim()}
            className="rounded-md bg-brand-black px-4 py-2 text-sm font-medium text-white hover:bg-brand-black-hover disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
