export type StockLevel = "ok" | "low" | "empty";

export interface InventoryRow {
  id: string;
  name: string;
  model: string;
  size: string;
  stock: number;
  stockLevel: StockLevel;
  supplierPrice: number;
  publicPrice: number;
}

export const SHOWCASE_INVENTORY: InventoryRow[] = [
  // ── Productos adicionales para SHOWCASE_INVENTORY ──────────────────────────
// Precios verificados en refaccionarias mexicanas en línea (jun–jul 2025)
// Fuentes: Refaccionaria Angelo, Motomundo, Refaso, MercadoLibre MX

{
  id: "filtro-aire-ft150",
  name: "Filtro de aire",
  model: "FT125 / FT150",
  size: "Universal",
  stock: 12,
  stockLevel: "ok",
  supplierPrice: 48,   // retail online Promoto ≈ $85
  publicPrice: 95,
},
{
  id: "aceite-10w40-semi",
  name: "Aceite LTH 4T",
  model: "10w-40",
  size: " 1L",
  stock: 0,
  stockLevel: "empty",
  supplierPrice: 130,
  publicPrice: 230,
},
{
  id: "casco-media-cara",
  name: "Casco media cara",
  model: "Económico",
  size: "M",
  stock: 13,
  stockLevel: "ok",
  supplierPrice: 195,
  publicPrice: 380,
},
{
  id: "filtro-aceite-125",
  name: "Filtro de aceite",
  model: "125cc - 150cc",
  size: "HF303",
  stock: 5,
  stockLevel: "low",
  supplierPrice: 22,   // retail Angelo FZ16 ≈ $35
  publicPrice: 48,
},
];

export function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-MX")}`;
}
