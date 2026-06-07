"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/lib/api";
import {
  DEFAULT_PRODUCT_PAGE,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products.pagination";
import {
  normalizeProductSearch,
  productMatchesSearch,
  PRODUCT_SEARCH_DEBOUNCE_MS,
} from "@/lib/products.search";
import {
  cachedProducts,
  cacheProductPage,
  cacheProductSearchPage,
  productSearchCacheKey,
  removeProductFromPage,
  updateProductInPage,
} from "@/lib/products.client-cache";

import type {
  CreateProductInput,
  ModalState,
  Product,
  ProductPage,
  UpdateProductInput,
} from "@/types";

interface UseInventoryOptions {
  initialError?: string | null;
  initialPage?: ProductPage;
}

interface ProductSearchResult {
  query: string;
  productPage: ProductPage;
}

const emptyProductPage: ProductPage = {
  products: [],
  page: DEFAULT_PRODUCT_PAGE,
  pageSize: PRODUCT_PAGE_SIZE,
  hasNextPage: false,
};

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useInventory({
  initialError = null,
  initialPage,
}: UseInventoryOptions = {}) {
  const hasInitialPage = initialPage !== undefined;
  const [productPage, setProductPage] = useState<ProductPage>(
    initialPage ?? emptyProductPage,
  );
  const pageCache = useRef<Map<number, ProductPage>>(
    initialPage
      ? new Map([[initialPage.page, initialPage]])
      : new Map(),
  );
  const searchPageCache = useRef<Map<string, ProductPage>>(new Map());
  const searchAbortController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);

  const [search, setSearch] = useState("");
  const normalizedSearch = useMemo(() => normalizeProductSearch(search), [search]);
  const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasInitialPage && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const activeSearchPage =
    searchResult?.query === normalizedSearch
      ? searchResult.productPage
      : null;
  const isSearchMode = normalizedSearch.length > 0;

  const showActionError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const dismissActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const fetchPage = useCallback(async (page: number, force = false) => {
    if (page < DEFAULT_PRODUCT_PAGE) {
      return null;
    }

    const cachedPage = pageCache.current.get(page);

    if (cachedPage && !force) {
      cacheProductPage(pageCache.current, cachedPage);
      setProductPage(cachedPage);
      setError(null);
      setLoading(false);
      return cachedPage;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getProducts({ page });
      cacheProductPage(pageCache.current, data);
      setProductPage(data);
      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Error desconocido"));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearchPage = useCallback(
    async (query: string, page: number, force = false) => {
      if (!query || page < DEFAULT_PRODUCT_PAGE) {
        return null;
      }

      searchAbortController.current?.abort();
      const requestId = searchRequestId.current + 1;
      searchRequestId.current = requestId;

      const cacheKey = productSearchCacheKey(query, page);
      const cachedPage = searchPageCache.current.get(cacheKey);

      if (cachedPage && !force) {
        cacheProductSearchPage(searchPageCache.current, query, cachedPage);
        setSearchResult({ query, productPage: cachedPage });
        setSearchError(null);
        setSearchLoading(false);
        return cachedPage;
      }

      const controller = new AbortController();
      searchAbortController.current = controller;

      try {
        setSearchLoading(true);
        setSearchError(null);

        const data = await getProducts({
          page,
          search: query,
          signal: controller.signal,
        });

        if (requestId !== searchRequestId.current) {
          return null;
        }

        cacheProductSearchPage(searchPageCache.current, query, data);
        setSearchResult({ query, productPage: data });
        return data;
      } catch (err) {
        if (isAbortError(err) || requestId !== searchRequestId.current) {
          return null;
        }

        setSearchError(getErrorMessage(err, "Error al buscar productos"));
        return null;
      } finally {
        if (requestId === searchRequestId.current) {
          searchAbortController.current = null;
          setSearchLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasInitialPage && !initialError) {
      void fetchPage(DEFAULT_PRODUCT_PAGE);
    }
  }, [fetchPage, hasInitialPage, initialError]);

  useEffect(() => {
    searchAbortController.current?.abort();
    searchRequestId.current += 1;
    setSearchError(null);

    if (!normalizedSearch) {
      setSearchResult(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const timeout = window.setTimeout(() => {
      void fetchSearchPage(normalizedSearch, DEFAULT_PRODUCT_PAGE);
    }, PRODUCT_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      searchAbortController.current?.abort();
      searchRequestId.current += 1;
    };
  }, [fetchSearchPage, normalizedSearch]);

  const localSearchProducts = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }

    return cachedProducts(pageCache.current, productPage).filter((product) =>
      productMatchesSearch(product, normalizedSearch),
    );
  }, [normalizedSearch, productPage]);

  const visibleProducts = isSearchMode
    ? activeSearchPage?.products ?? localSearchProducts
    : productPage.products;
  const visiblePage = isSearchMode
    ? activeSearchPage?.page ?? DEFAULT_PRODUCT_PAGE
    : productPage.page;
  const hasNextPage = isSearchMode
    ? activeSearchPage?.hasNextPage ?? false
    : productPage.hasNextPage;
  const isSearching =
    isSearchMode &&
    (searchLoading || (!activeSearchPage && searchError === null));

  const updateCachedProduct = useCallback((updatedProduct: Product) => {
    pageCache.current.forEach((cachedPage, page) => {
      pageCache.current.set(page, updateProductInPage(cachedPage, updatedProduct));
    });

    setProductPage((currentPage) =>
      updateProductInPage(currentPage, updatedProduct),
    );
  }, []);

  const handleCreate = async (input: CreateProductInput) => {
    try {
      dismissActionError();
      await createProduct(input);
      setModal({ mode: "closed" });

      pageCache.current.clear();
      searchPageCache.current.clear();

      const refreshedPage = await fetchPage(productPage.page, true);

      if (
        refreshedPage &&
        refreshedPage.products.length === 0 &&
        productPage.page > DEFAULT_PRODUCT_PAGE
      ) {
        await fetchPage(productPage.page - 1, true);
      }

      if (normalizedSearch) {
        await fetchSearchPage(
          normalizedSearch,
          activeSearchPage?.page ?? DEFAULT_PRODUCT_PAGE,
          true,
        );
      }
    } catch (err) {
      showActionError(getErrorMessage(err, "Error al crear"));
    }
  };

  const handleUpdate = async (input: UpdateProductInput) => {
    try {
      dismissActionError();
      const updated = await updateProduct(input);

      updateCachedProduct(updated);
      setSearchResult((currentResult) => {
        if (!currentResult) {
          return currentResult;
        }

        return {
          ...currentResult,
          productPage: updateProductInPage(currentResult.productPage, updated),
        };
      });
      searchPageCache.current.clear();
      setModal({ mode: "closed" });

      if (normalizedSearch) {
        await fetchSearchPage(
          normalizedSearch,
          activeSearchPage?.page ?? DEFAULT_PRODUCT_PAGE,
          true,
        );
      }
    } catch (err) {
      showActionError(getErrorMessage(err, "Error al actualizar"));
    }
  };

  const handleDelete = async (id: string) => {
    const previousPage = productPage;
    const previousPageCache = new Map(pageCache.current);
    const previousSearchResult = searchResult;

    dismissActionError();
    pageCache.current.forEach((cachedPage, page) => {
      pageCache.current.set(page, removeProductFromPage(cachedPage, id));
    });
    setProductPage((currentPage) => removeProductFromPage(currentPage, id));
    setSearchResult((currentResult) => {
      if (!currentResult) {
        return currentResult;
      }

      return {
        ...currentResult,
        productPage: removeProductFromPage(currentResult.productPage, id),
      };
    });

    try {
      await deleteProduct(id);
    } catch (err) {
      pageCache.current = previousPageCache;
      setProductPage(previousPage);
      setSearchResult(previousSearchResult);
      showActionError(getErrorMessage(err, "Error al eliminar"));
      return;
    }

    pageCache.current.clear();
    searchPageCache.current.clear();
    const refreshedPage = await fetchPage(previousPage.page, true);

    if (
      refreshedPage &&
      refreshedPage.products.length === 0 &&
      previousPage.page > DEFAULT_PRODUCT_PAGE
    ) {
      await fetchPage(previousPage.page - 1, true);
    }

    if (normalizedSearch) {
      const searchPage = await fetchSearchPage(
        normalizedSearch,
        activeSearchPage?.page ?? DEFAULT_PRODUCT_PAGE,
        true,
      );

      if (
        searchPage &&
        searchPage.products.length === 0 &&
        searchPage.page > DEFAULT_PRODUCT_PAGE
      ) {
        await fetchSearchPage(normalizedSearch, searchPage.page - 1, true);
      }
    }
  };

  const openCreate = () => setModal({ mode: "create" });
  const openEdit = (product: Product) => setModal({ mode: "edit", product });
  const closeModal = () => setModal({ mode: "closed" });

  const goToPreviousPage = useCallback(() => {
    if (normalizedSearch && activeSearchPage) {
      void fetchSearchPage(normalizedSearch, activeSearchPage.page - 1);
      return;
    }

    void fetchPage(productPage.page - 1);
  }, [
    activeSearchPage,
    fetchPage,
    fetchSearchPage,
    normalizedSearch,
    productPage.page,
  ]);

  const goToNextPage = useCallback(() => {
    if (normalizedSearch && activeSearchPage) {
      if (activeSearchPage.hasNextPage) {
        void fetchSearchPage(normalizedSearch, activeSearchPage.page + 1);
      }
      return;
    }

    if (productPage.hasNextPage) {
      void fetchPage(productPage.page + 1);
    }
  }, [
    activeSearchPage,
    fetchPage,
    fetchSearchPage,
    normalizedSearch,
    productPage.hasNextPage,
    productPage.page,
  ]);

  const refetch = useCallback(() => {
    if (normalizedSearch) {
      void fetchSearchPage(
        normalizedSearch,
        activeSearchPage?.page ?? DEFAULT_PRODUCT_PAGE,
        true,
      );
      return;
    }

    void fetchPage(productPage.page, true);
  }, [
    activeSearchPage?.page,
    fetchPage,
    fetchSearchPage,
    normalizedSearch,
    productPage.page,
  ]);

  return {
    products: visibleProducts,
    page: visiblePage,
    hasNextPage,
    showPagination: !isSearchMode || activeSearchPage !== null,
    search,
    setSearch,
    isSearchMode,
    isSearching,
    isShowingLocalSearchResults: isSearchMode && activeSearchPage === null,
    searchError,
    loading: isSearchMode ? false : loading,
    paginationLoading: isSearchMode ? searchLoading : loading,
    error: isSearchMode ? null : error,
    actionError,
    modal,
    handleCreate,
    handleUpdate,
    handleDelete,
    showActionError,
    dismissActionError,
    openCreate,
    openEdit,
    closeModal,
    goToPreviousPage,
    goToNextPage,
    refetch,
  };
}
