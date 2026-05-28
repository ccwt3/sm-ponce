import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StockStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Formatea un número como precio en pesos mexicanos.
 * Ejemplo: 1200 → "$1,200"
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Determina el estado de stock según la cantidad disponible.
 */
export function getStockStatus(existencia: number): StockStatus {
  if (existencia === 0) return "empty";
  if (existencia <= 3) return "low";
  return "ok";
}

/**
 * Clases Tailwind para el badge de existencia según el estado.
 */
export const stockBadgeClasses: Record<StockStatus, string> = {
  ok: "bg-brand-stock-ok-bg text-brand-stock-ok-text",
  low: "bg-brand-stock-low-bg text-brand-stock-low-text",
  empty: "bg-brand-stock-empty-bg text-brand-stock-empty-text",
};

/**
 * Genera un id único simple (para uso local / optimistic updates).
 * En producción el id real viene de la base de datos.
 */
export function generateTempId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Filtra un arreglo de productos por un término de búsqueda.
 */
export function filterProducts<
  T extends { nombre: string; modelo: string; tipo: string },
>(products: T[], query: string): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.modelo.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q),
  );
}
