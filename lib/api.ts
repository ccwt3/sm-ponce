/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  api.ts  —  Capa de acceso a datos
 *
 *  PUNTOS DE ENTRADA A LA BASE DE DATOS
 *  ─────────────────────────────────────
 *  Cada función de este archivo representa UN punto donde el frontend se
 *  conecta con el backend/DB. Para alimentar el sistema con datos reales:
 *
 *  1. Reemplaza la URL base en API_BASE_URL con la de tu API (REST, GraphQL,
 *     Supabase, PlanetScale, etc.)
 *  2. Agrega autenticación en el header "Authorization" si tu API lo requiere.
 *  3. Si usas Supabase, puedes reemplazar fetch() con el cliente de Supabase:
 *       import { supabase } from "@/lib/supabase"
 *       const { data, error } = await supabase.from("products").select("*")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListResponse,
  ProductResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"; // 👈 PUNTO DE CONFIGURACIÓN

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── 📌 PUNTO DE ENTRADA 1: Listar productos ─────────────────────────────────
/**
 * Obtiene todos los productos desde la base de datos.
 * Conectar a: GET /api/products  →  tabla `products` en tu DB
 */
export async function getProducts(): Promise<Product[]> {
  const response = await apiFetch<ProductListResponse>("/products");
  return response.data;
}

// ─── 📌 PUNTO DE ENTRADA 2: Obtener un producto por ID ───────────────────────
/**
 * Conectar a: GET /api/products/:id  →  SELECT * FROM products WHERE id = ?
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await apiFetch<ProductResponse>(`/products/${id}`);
  return response.data;
}

// ─── 📌 PUNTO DE ENTRADA 3: Crear producto ───────────────────────────────────
/**
 * Conectar a: POST /api/products  →  INSERT INTO products (...)
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await apiFetch<ProductResponse>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

// ─── 📌 PUNTO DE ENTRADA 4: Actualizar producto ──────────────────────────────
/**
 * Conectar a: PUT /api/products/:id  →  UPDATE products SET ... WHERE id = ?
 */
export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const { id, ...body } = input;
  const response = await apiFetch<ProductResponse>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return response.data;
}

// ─── 📌 PUNTO DE ENTRADA 5: Eliminar producto ────────────────────────────────
/**
 * Conectar a: DELETE /api/products/:id  →  DELETE FROM products WHERE id = ?
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: "DELETE" });
}
