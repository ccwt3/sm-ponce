import { SHOWCASE_ANCHOR_ID } from "@/lib/landing/constants";
import { SHOWCASE_INVENTORY, formatPrice } from "@/lib/landing/showcase-data";
import { StockBadge } from "./stock-badge";

const TABLE_COLUMNS = [
  "Nombre",
  "Modelo",
  "Medida",
  "Existencia",
  "P. Proveedor",
  "P. Público",
  "Acciones",
] as const;

export function InventoryShowcase() {
  return (
    <div
      id={SHOWCASE_ANCHOR_ID}
      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#555]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#555]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#555]" />
      </div>

      <div className="overflow-x-auto bg-white p-4">
        <div className="mb-3.5 flex items-center justify-between border-b border-brand-border pb-3.5">
          <span className="text-[17px] font-extrabold tracking-tight">Inventario</span>
          <div className="flex items-center gap-2">
            <LivePulse />
            <span className="rounded-md bg-brand-black px-3.5 py-1.5 text-xs font-bold text-white">
              + Agregar
            </span>
          </div>
        </div>

        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className="border-b border-brand-border pb-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-brand-text-muted"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHOWCASE_INVENTORY.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-brand-surface">
                <td className="border-b border-[#F1F1F1] py-3.5 text-sm font-bold text-brand-text-primary">
                  {item.name}
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5 text-[13px] text-brand-text-secondary">
                  {item.model}
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5 text-[13px] text-brand-text-secondary">
                  {item.size}
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5">
                  <StockBadge level={item.stockLevel} value={item.stock} />
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5 font-mono text-[13px] text-brand-text-primary">
                  {formatPrice(item.supplierPrice)}
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5 font-mono text-[13px] text-brand-text-primary">
                  {formatPrice(item.publicPrice)}
                </td>
                <td className="border-b border-[#F1F1F1] py-3.5">
                  <div className="flex gap-1.5">
                    <button className="rounded-md border border-brand-border px-2.5 py-1 text-[11.5px] font-semibold text-brand-text-primary">
                      Editar
                    </button>
                    <button className="rounded-md border border-brand-danger-border px-2.5 py-1 text-[11.5px] font-semibold text-brand-danger">
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-stock-ok-text">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-stock-ok-text" />
      En vivo
    </span>
  );
}
