export const DEFAULT_PRODUCT_PAGE = 0;
export const PRODUCT_PAGE_SIZE = 50;
export const MAX_CACHED_PRODUCT_PAGES = 5;

export function parseProductPage(value: string | null): number | null {
  if (value === null) {
    return DEFAULT_PRODUCT_PAGE;
  }

  const page = Number(value);

  return Number.isSafeInteger(page) && page >= 0 ? page : null;
}
