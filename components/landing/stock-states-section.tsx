import { StockBadge } from "./stock-badge";
import type { StockLevel } from "../../lib/landing/showcase-data";

const STOCK_EXAMPLES: Array<{ label: string; level: StockLevel; value: number }> = [
  { label: "Stock saludable", level: "ok", value: 30 },
  { label: "Por agotarse", level: "low", value: 2 },
  { label: "Sin existencia", level: "empty", value: 0 },
];

export function StockStatesSection() {
  return (
    <section className="bg-brand-surface px-5 py-16 sm:px-8 sm:py-[88px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-9 max-w-[600px]">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-text-muted">
            Estado de existencias
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Un vistazo te dice qué surtir hoy.
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-brand-text-secondary">
            Cada pieza se marca sola según su existencia. Sin reportes que armar, sin contar a
            mano.
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {STOCK_EXAMPLES.map((example) => (
            <div
              key={example.label}
              className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-4"
            >
              <span className="text-[13.5px] font-semibold text-brand-text-secondary">
                {example.label}
              </span>
              <StockBadge level={example.level} value={example.value} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
