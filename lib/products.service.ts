import "server-only";

import itemsDatabase from "@/database/items";
import typesDatabase from "@/database/productTypes";
import { getCurrentUserId } from "@/lib/server-utils";
import {
  validateCreateProductInput,
  validateUpdateProductInput,
} from "@/lib/validation/products";
import type { Product, ProductRow, ProductType, RawProduct } from "@/types";

export class ProductServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function productFromRow(
  row: ProductRow,
  productType?: Pick<ProductType, "tipo_de_producto"> | null,
): Product {
  return {
    ...row,
    tipo_id: productType?.tipo_de_producto ?? "Sin tipo",
  };
}

export function normalizeProduct(product: RawProduct): Product {
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

export async function getProductsForDashboard(): Promise<Product[]> {
  const userId = await getCurrentUserId();
  const rawProducts = await itemsDatabase.getAllProducts({ userId });

  return rawProducts.map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const userId = await getCurrentUserId();
  const product = await itemsDatabase.getProductById(id, userId);

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
  const productType = body.tipo_id
    ? await resolveProductType(body.tipo_id, userId)
    : null;

  const updatedProduct = await itemsDatabase.updateProduct(
    {
      ...body,
      id,
      ...(productType ? { tipo_id: productType.id } : {}),
    },
    userId,
  );

  if (!updatedProduct) {
    throw new ProductServiceError("Producto no encontrado", 404);
  }

  const responseType = productType ?? (
    updatedProduct.tipo_id
      ? await typesDatabase.findType(updatedProduct.tipo_id, userId)
      : null
  );

  return productFromRow(updatedProduct, responseType);
}

export async function deleteProduct(id: string): Promise<string> {
  const userId = await getCurrentUserId();
  const deletedId = await itemsDatabase.deleteProduct(id, userId);

  if (!deletedId) {
    throw new ProductServiceError("Producto no encontrado", 404);
  }

  return deletedId;
}
