import type { CreateProductInput, Product } from "@/types";

type ProductFormFieldName = keyof Pick<
  CreateProductInput,
  | "nombre"
  | "modelo"
  | "medida"
  | "tipo_id"
  | "existencia"
  | "precio_proveedor"
  | "precio_publico"
>;

type ProductTableColumnKey = keyof Pick<
  Product,
  | "nombre"
  | "modelo"
  | "medida"
  | "tipo_id"
  | "existencia"
  | "precio_proveedor"
  | "precio_publico"
>;

export type ProductFormInputKind =
  | "text"
  | "productType"
  | "integer"
  | "decimal";
export type ProductTableColumnKind = "emphasis" | "text" | "stock" | "price";

export interface ProductFormField {
  name: ProductFormFieldName;
  label: string;
  kind: ProductFormInputKind;
  span?: "full";
}

export interface ProductTableColumn {
  key: ProductTableColumnKey;
  label: string;
  kind: ProductTableColumnKind;
}

export const productFormFields = [
  {
    name: "nombre",
    label: "Nombre",
    kind: "text",
    span: "full",
  },
  {
    name: "modelo",
    label: "Modelo",
    kind: "text",
  },
  {
    name: "medida",
    label: "Medida",
    kind: "text",
  },
  {
    name: "tipo_id",
    label: "Tipo",
    kind: "productType",
  },
  {
    name: "existencia",
    label: "Existencia",
    kind: "integer",
  },
  {
    name: "precio_proveedor",
    label: "Precio Proveedor",
    kind: "decimal",
  },
  {
    name: "precio_publico",
    label: "Precio Público",
    kind: "decimal",
  },
] as const satisfies readonly ProductFormField[];

export const productTableColumns = [
  {
    key: "nombre",
    label: "Nombre",
    kind: "emphasis",
  },
  {
    key: "modelo",
    label: "Modelo",
    kind: "text",
  },
  {
    key: "medida",
    label: "Medida",
    kind: "text",
  },
  {
    key: "tipo_id",
    label: "Tipo",
    kind: "text",
  },
  {
    key: "existencia",
    label: "Existencia",
    kind: "stock",
  },
  {
    key: "precio_proveedor",
    label: "Precio Proveedor",
    kind: "price",
  },
  {
    key: "precio_publico",
    label: "Precio Público",
    kind: "price",
  },
] as const satisfies readonly ProductTableColumn[];

