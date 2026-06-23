import "server-only";

import productTypesDatabase from "@/database/productTypes";
import { getCurrentUserId } from "@/lib/server-utils";
import { validateSupabaseTableId } from "@/lib/validation/ids";
import { validateProductTypeInput } from "@/lib/validation/productTypes";
import type { ProductType } from "@/types";

export class ProductTypesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function getProductTypes(): Promise<ProductType[]> {
  const userId = await getCurrentUserId();

  return productTypesDatabase.getAllTypesOfProducts(userId);
}

export async function createProductType(input: unknown): Promise<ProductType> {
  const validation = validateProductTypeInput(input);

  if (!validation.success) {
    throw new ProductTypesServiceError(validation.error, 400);
  }

  const newProductType = validation.data;
  const userId = await getCurrentUserId();
  const existingType = await productTypesDatabase.findType(
    newProductType,
    userId,
  );

  if (existingType) {
    return existingType;
  }

  return productTypesDatabase.createTypeOfProduct({
    newProductType,
    userId,
  });
}

export async function deleteProductType(id: string): Promise<number> {
  const idValidation = validateSupabaseTableId(id);

  if (!idValidation.success) {
    throw new ProductTypesServiceError(idValidation.error, 400);
  }

  const typeId = Number(idValidation.id);
  const userId = await getCurrentUserId();
  const deleted = await productTypesDatabase.deleteTypeOfProduct(
    typeId,
    userId,
  );

  if (!deleted) {
    throw new ProductTypesServiceError("Tipo de producto no encontrado", 404);
  }

  return typeId;
}
