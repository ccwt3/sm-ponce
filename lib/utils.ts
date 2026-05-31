import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StockStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes.
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);
}

export function getStockStatus(existencia: number): StockStatus {
  if (existencia === 0) return "empty";
  if (existencia <= 3) return "low";
  return "ok";
}

export function generateTempId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function filterProducts<
  T extends { nombre: string; modelo: string; tipo: string },
>(products: T[], query: string): T[] {
  const q = query.toLowerCase().trim();

  if (!q) {
    return products;
  }

  return products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.modelo.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q),
  );
}
