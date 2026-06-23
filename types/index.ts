export interface ProductRow {
  id: number;
  nombre: string;
  modelo: string | null;
  medida: string | null;
  tipo_id: number | null;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
  user_id: string;
}

export interface RawProduct extends ProductRow {
  tipo: { tipo_de_producto: string } | null;
}

export interface Product {
  id: string;
  nombre: string;
  modelo: string | null;
  medida: string | null;
  tipo_id: string;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
}

export interface ProductPage {
  products: Product[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export type ProductWriteInput = Omit<ProductRow, "id">;

export type ProductUpdateWriteInput = Partial<
  Omit<ProductWriteInput, "user_id">
> & { id: number };

export interface CreateProductInput {
  nombre: string;
  modelo: string | null;
  medida: string | null;
  tipo_id: string;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
}

export type UpdateProductInput = Partial<CreateProductInput> & { id: string };

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export type ProductListResponse = ApiResponse<ProductPage>;
export type ProductResponse = ApiResponse<Product>;

export type StockStatus = "ok" | "low" | "empty";

export interface ModalState {
  mode: "create" | "edit" | "closed";
  product?: Product;
}

export interface ProductType {
  id: number;
  tipo_de_producto: string;
}
