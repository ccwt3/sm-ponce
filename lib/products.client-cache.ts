import { MAX_CACHED_PRODUCT_PAGES } from "@/lib/products.pagination";
import { MAX_CACHED_PRODUCT_SEARCH_PAGES } from "@/lib/products.search";
import type { Product, ProductPage } from "@/types";

function setLruCacheValue<Key, Value>(
  cache: Map<Key, Value>,
  key: Key,
  value: Value,
  maxSize: number,
) {
  cache.delete(key);
  cache.set(key, value);

  if (cache.size <= maxSize) {
    return;
  }

  const oldestKey = cache.keys().next().value;

  if (oldestKey !== undefined) {
    cache.delete(oldestKey);
  }
}

export function cacheProductPage(
  cache: Map<number, ProductPage>,
  productPage: ProductPage,
) {
  setLruCacheValue(
    cache,
    productPage.page,
    productPage,
    MAX_CACHED_PRODUCT_PAGES,
  );
}

export function productSearchCacheKey(query: string, page: number): string {
  return `${query}:${page}`;
}

export function cacheProductSearchPage(
  cache: Map<string, ProductPage>,
  query: string,
  productPage: ProductPage,
) {
  setLruCacheValue(
    cache,
    productSearchCacheKey(query, productPage.page),
    productPage,
    MAX_CACHED_PRODUCT_SEARCH_PAGES,
  );
}

export function cachedProducts(
  cache: Map<number, ProductPage>,
  currentPage: ProductPage,
): Product[] {
  const productsById = new Map<string, Product>();
  const pages = new Map(cache);
  pages.set(currentPage.page, currentPage);
  const orderedPages = [...pages.entries()].sort(
    ([firstPage], [secondPage]) => firstPage - secondPage,
  );

  orderedPages.forEach(([, productPage]) => {
    productPage.products.forEach((product) => {
      productsById.set(product.id, product);
    });
  });

  return [...productsById.values()];
}

export function updateProductInPage(
  productPage: ProductPage,
  updatedProduct: Product,
): ProductPage {
  if (!productPage.products.some((product) => product.id === updatedProduct.id)) {
    return productPage;
  }

  return {
    ...productPage,
    products: productPage.products.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product,
    ),
  };
}

export function removeProductFromPage(
  productPage: ProductPage,
  productId: string,
): ProductPage {
  return {
    ...productPage,
    products: productPage.products.filter((product) => product.id !== productId),
  };
}
