import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StockStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  if (existencia <= 5) return "low";
  return "ok";
}
