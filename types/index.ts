// ─── Product ────────────────────────────────────────────────────────────────

// Lo que devuelve Supabase (raw)
export interface RawProduct {
  id: string;
  nombre: string;
  modelo: string;
  medida: string;
  tipo: { tipo_de_producto: string } | null;  // objeto, siempre
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface Product {
  id: string;
  nombre: string;
  modelo: string;
  medida: string;
  tipo: string;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
  creadoEn?: string; // ISO date string
  actualizadoEn?: string;
}

// Payload para crear un producto (sin id ni timestamps)
export type CreateProductInput = Omit<Product, "id" | "creadoEn" | "actualizadoEn">;

// Payload para actualizar (todos los campos opcionales excepto id)
export type UpdateProductInput = Partial<CreateProductInput> & { id: string };

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export type ProductListResponse = ApiResponse<Product[]>;
export type ProductResponse = ApiResponse<Product>;

// ─── UI / Table ─────────────────────────────────────────────────────────────

export type SortField = keyof Pick<
  Product,
  "nombre" | "tipo" | "existencia" | "precio_proveedor" | "precio_publico"
>;

export type SortDirection = "asc" | "desc";

export interface TableSort {
  field: SortField;
  direction: SortDirection;
}

export type StockStatus = "ok" | "low" | "empty";

// ─── Modal ───────────────────────────────────────────────────────────────────

export type ModalMode = "create" | "edit" | "closed";

export interface ModalState {
  mode: ModalMode;
  product?: Product; // presente solo en modo "edit"
}
