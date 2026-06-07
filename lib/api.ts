import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListResponse,
  ProductPage,
  ProductResponse,
  ProductType,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface GetProductsOptions {
  page?: number;
  search?: string;
  signal?: AbortSignal;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getProducts({
  page = 0,
  search = "",
  signal,
}: GetProductsOptions = {}): Promise<ProductPage> {
  const query = new URLSearchParams({ page: String(page) });

  if (search) {
    query.set("q", search);
  }

  const response = await apiFetch<ProductListResponse>(
    `/products?${query.toString()}`,
    { signal },
  );
  return response.data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await apiFetch<ProductResponse>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const { id, ...body } = input;
  const response = await apiFetch<ProductResponse>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: "DELETE" });
}

export async function getProductTypes(): Promise<ProductType[]> {
  const response = await apiFetch<{ data: ProductType[] }>("/product-types");
  return response.data;
}

export async function createProductType(newProductType: string): Promise<ProductType> {
  const response = await apiFetch<{ data: ProductType }>(`/product-types`, {
    method: "POST",
    body: JSON.stringify(newProductType),
  });

  return response.data;
}

export async function deleteProductType(id: string): Promise<void> {
  await apiFetch(`/product-types/${id}`, { method: "DELETE" });
}
