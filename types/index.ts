export interface ProductRow {
  id: string;
  nombre: string;
  modelo: string | null;
  medida: string | null;
  tipo_id: string;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
  creadoEn?: string;
  actualizadoEn?: string;
  user_id?: string;
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
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ProductPage {
  products: Product[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export type ProductWriteInput = Omit<
  ProductRow,
  "id" | "creadoEn" | "actualizadoEn"
>;

export type CreateProductInput = Omit<
  Product,
  "id" | "creadoEn" | "actualizadoEn"
>;

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
  id: string;
  tipo_de_producto: string;
}
