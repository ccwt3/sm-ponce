import type { Product } from "@/types";

export const PRODUCT_SEARCH_DEBOUNCE_MS = 450;
export const MAX_PRODUCT_SEARCH_LENGTH = 100;
export const MAX_CACHED_PRODUCT_SEARCH_PAGES = 10;

const productSearchFields = ["nombre", "medida", "modelo", "tipo_id"] as const;

export function normalizeProductSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function parseProductSearch(value: string | null): string | null {
  const search = value?.trim() ?? "";

  return search.length <= MAX_PRODUCT_SEARCH_LENGTH ? search : null;
}

export function productMatchesSearch(product: Product, search: string): boolean {
  const normalizedSearch = normalizeProductSearch(search);

  if (!normalizedSearch) {
    return true;
  }

  return productSearchFields.some((field) =>
    String(product[field] ?? "").toLowerCase().includes(normalizedSearch),
  );
}
