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
  {
    id: "balatas-delanteras",
    name: "Balatas delanteras",
    model: "Tsuru 1.6",
    size: "100x200",
    stock: 30,
    stockLevel: "ok",
    supplierPrice: 80,
    publicPrice: 200,
  },
  {
    id: "filtro-aceite",
    name: "Filtro de aceite",
    model: "Aveo 1.5",
    size: "76mm",
    stock: 0,
    stockLevel: "empty",
    supplierPrice: 0,
    publicPrice: 0,
  },
  {
    id: "amortiguador-trasero",
    name: "Amortiguador trasero",
    model: "Jetta A4",
    size: "22x11",
    stock: 2,
    stockLevel: "low",
    supplierPrice: 1200,
    publicPrice: 5000,
  },
  {
    id: "bujia-iridium",
    name: "Bujía iridium",
    model: "Versa 1.6",
    size: "14mm",
    stock: 233,
    stockLevel: "ok",
    supplierPrice: 323,
    publicPrice: 23,
  },
];

export function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-MX")}`;
}
