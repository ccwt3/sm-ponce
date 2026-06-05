import { useEffect, useState } from "react";

import { ProductModalFields } from "@/components/inventory/ProductModalFields";
import { inventoryButton } from "@/components/inventory/styles";
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
  onValidationError: (message: string) => void;
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
    modelo: product.modelo ?? "",
    medida: product.medida ?? "",
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
  onValidationError,
}: ProductModalProps) {
  const [form, setForm] = useState<CreateProductInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = modal.mode === "edit";
  const canSubmit = Boolean(form.nombre.trim());

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

  const handleChange = (
    key: keyof CreateProductInput,
    value: string | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      onValidationError("Nombre no puede estar vacio");
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
      <div className="w-full max-w-md animate-modal-in rounded-lg border border-border bg-background p-6 shadow-modal">
        <h2 className="mb-5 text-base font-medium text-foreground">
          {isEdit ? "Editar producto" : "Agregar producto"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <ProductModalFields handleChange={handleChange} form={form} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className={inventoryButton.secondary}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={inventoryButton.modalPrimary}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
