import { Check, Package, SearchX } from "lucide-react";

import { inventoryButton } from "@/components/inventory/styles";
import { cn } from "@/lib/utils";

const quickStartSteps = [
  "Registra tus primeras piezas (bujías, balatas, filtros)",
  "Crea categorías (Motor, Frenos, Eléctrico)",
  "Define stock mínimo para alertas",
];

interface EmptyInventoryStateProps {
  onAddFirst: () => void;
}

/**
 * Versión A: el inventario no tiene ningún producto registrado todavía.
 * Guía al usuario a crear su primera refacción.
 */
export function EmptyInventoryState({ onAddFirst }: EmptyInventoryStateProps) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Package
        size={64}
        strokeWidth={1.5}
        className="text-muted-foreground/40"
      />

      <h2 className="mt-6 text-lg font-bold text-foreground">
        Tu inventario de refacciones está vacío
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Comienza a registrar tus piezas, aceites y accesorios para llevar el
        control de tu stock.
      </p>

      <button
        onClick={onAddFirst}
        className={cn(inventoryButton.primary, "mt-6")}
      >
        + Agregar primera refacción
      </button>

      <div className="mt-10 w-full max-w-md rounded-lg border border-border bg-muted/40 p-5 text-left">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Guía de inicio rápido
        </p>
        <ul className="space-y-3">
          {quickStartSteps.map((step) => (
            <li
              key={step}
              className="flex items-start gap-3 text-sm text-foreground"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <Check size={12} className="text-muted-foreground" />
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface EmptySearchStateProps {
  onClearSearch: () => void;
}

/**
 * Versión B: hay un término de búsqueda activo pero ningún producto coincide.
 * Ofrece limpiar la búsqueda para volver al listado completo.
 */
export function EmptySearchState({ onClearSearch }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <SearchX
        size={56}
        strokeWidth={1.5}
        className="text-muted-foreground/40"
      />

      <h2 className="mt-6 text-lg font-bold text-foreground">
        Sin resultados para tu búsqueda
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Intenta con otro término o revisa el filtro activo.
      </p>

      <button
        onClick={onClearSearch}
        className={cn(inventoryButton.secondary, "mt-6")}
      >
        Limpiar búsqueda
      </button>
    </div>
  );
}
