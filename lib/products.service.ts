import "server-only";

import itemsDatabase from "@/database/items";
import typesDatabase from "@/database/productTypes";
import {
  DEFAULT_PRODUCT_PAGE,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products.pagination";
import { getCurrentUserId } from "@/lib/server-utils";
import {
  validateCreateProductInput,
  validateUpdateProductInput,
} from "@/lib/validation/products";
import type {
  Product,
  ProductPage,
  ProductRow,
  ProductType,
  RawProduct,
} from "@/types";

export class ProductServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

interface GetProductsOptions {
  page?: number;
  search?: string;
}

function productFromRow(
  row: ProductRow,
  productType?: Pick<ProductType, "tipo_de_producto"> | null,
): Product {
  return {
    id: String(row.id),
    nombre: row.nombre,
    modelo: row.modelo,
    medida: row.medida,
    tipo_id: productType?.tipo_de_producto ?? "Sin tipo",
    existencia: row.existencia,
    precio_proveedor: row.precio_proveedor,
    precio_publico: row.precio_publico,
  };
}

function normalizeProduct(product: RawProduct): Product {
  return productFromRow(product, product.tipo);
}

async function resolveProductType(
  value: string,
  userId: string,
): Promise<ProductType> {
  const productType = await typesDatabase.findType(value, userId);

  if (!productType) {
    throw new ProductServiceError("Tipo de producto no encontrado", 400);
  }

  return productType;
}

export async function getProductsForDashboard(
  {
    page = DEFAULT_PRODUCT_PAGE,
    search = "",
  }: GetProductsOptions = {},
): Promise<ProductPage> {
  const userId = await getCurrentUserId();
  const productPage = await itemsDatabase.getProductsPage({
    page,
    search,
    userId,
  });

  return {
    products: productPage.products.map(normalizeProduct),
    page,
    pageSize: PRODUCT_PAGE_SIZE,
    hasNextPage: productPage.hasNextPage,
  };
}

export async function getProductById(id: string): Promise<Product> {
  const userId = await getCurrentUserId();
  const productId = Number(id);
  const product = await itemsDatabase.getProductById(productId, userId);

  if (!product) {
    throw new ProductServiceError("Producto no encontrado", 404);
  }

  return normalizeProduct(product);
}

export async function createProduct(input: unknown): Promise<Product> {
  const validation = validateCreateProductInput(input);

  if (!validation.success) {
    throw new ProductServiceError(validation.error, 400);
  }

  const body = validation.data;
  const userId = await getCurrentUserId();
  const productType = await resolveProductType(body.tipo_id, userId);

  const savedProduct = await itemsDatabase.createProduct({
    ...body,
    user_id: userId,
    tipo_id: productType.id,
  });

  return productFromRow(savedProduct, productType);
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<Product> {
  const validation = validateUpdateProductInput(input);

  if (!validation.success) {
    throw new ProductServiceError(validation.error, 400);
  }

  const body = validation.data;
  const userId = await getCurrentUserId();
  const productId = Number(id);
  const { tipo_id: typeName, ...productFields } = body;
  const productType = typeName
    ? await resolveProductType(typeName, userId)
    : null;

  const updatedProduct = await itemsDatabase.updateProduct(
    {
      ...productFields,
      id: productId,
      ...(typeName !== undefined ? { tipo_id: productType?.id ?? null } : {}),
    },
    userId,
  );

  if (!updatedProduct) {
    throw new ProductServiceError("Producto no encontrado", 404);
  }

  const responseType = productType ?? (
    updatedProduct.tipo_id
      ? await typesDatabase.findTypeById(updatedProduct.tipo_id, userId)
      : null
  );

  return productFromRow(updatedProduct, responseType);
}

export async function deleteProduct(id: string): Promise<string> {
  const userId = await getCurrentUserId();
  const productId = Number(id);
  const deletedId = await itemsDatabase.deleteProduct(productId, userId);

  if (!deletedId) {
    throw new ProductServiceError("Producto no encontrado", 404);
  }

  return String(deletedId);
}
