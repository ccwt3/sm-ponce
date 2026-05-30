import { useEffect, useState } from "react";

import { ProductModalFields } from "@/components/inventory/ProductModalFields";
import type {
  CreateProductInput,
  ModalState,
  Product,
  UpdateProductInput,
} from "@/types";

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
  tipo_id: "",
  existencia: 0,
  precio_proveedor: 0,
  precio_publico: 0,
};

function toProductForm(product: Product): CreateProductInput {
  return {
    nombre: product.nombre,
    modelo: product.modelo,
    medida: product.medida,
    tipo_id: product.tipo_id,
    existencia: product.existencia,
    precio_proveedor: product.precio_proveedor,
    precio_publico: product.precio_publico,
    user_id: product.user_id,
  };
}

export function ProductModal({
  modal,
  onClose,
  onCreate,
  onUpdate,
}: ProductModalProps) {
  const [form, setForm] = useState<CreateProductInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = modal.mode === "edit";

  useEffect(() => {
    if (modal.mode === "edit" && modal.product) {
      setForm(toProductForm(modal.product));
      return;
    }

    setForm(EMPTY_FORM);
  }, [modal]);

  if (modal.mode === "closed") {
    return null;
  }

  const handleChange = (key: keyof CreateProductInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      return;
    }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-md animate-modal-in rounded-lg border border-brand-border bg-white p-6 shadow-modal">
        <h2 className="mb-5 text-base font-medium text-brand-text-primary">
          {isEdit ? "Editar producto" : "Agregar producto"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <ProductModalFields handleChange={handleChange} form={form} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-brand-border px-4 py-2 text-sm text-brand-text-secondary transition-colors hover:bg-brand-surface"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nombre.trim()}
            className="rounded-md bg-brand-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-black-hover disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
