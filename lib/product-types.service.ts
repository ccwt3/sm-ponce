import "server-only";

import productTypesDatabase from "@/database/productTypes";
import { HttpError } from "@/lib/api-errors";
import { requireAcceptedTerms } from "@/lib/terms.service";
import { validateSupabaseTableId } from "@/lib/validation/ids";
import { validateProductTypeInput } from "@/lib/validation/productTypes";
import type { ProductType } from "@/types";

export class ProductTypesServiceError extends HttpError {
  constructor(
    message: string,
    status: number,
  ) {
    super(message, status);
  }
}

export async function getProductTypes(): Promise<ProductType[]> {
  const userId = await requireAcceptedTerms();

  return productTypesDatabase.getAllTypesOfProducts(userId);
}

export async function createProductType(input: unknown): Promise<ProductType> {
  const validation = validateProductTypeInput(input);

  if (!validation.success) {
    throw new ProductTypesServiceError(validation.error, 400);
  }

  const newProductType = validation.data;
  const userId = await requireAcceptedTerms();
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
    throw new ProductTypesServiceError("Id de tipo de producto invalido", 400);
  }

  const typeId = Number(idValidation.id);
  const userId = await requireAcceptedTerms();
  const deleted = await productTypesDatabase.deleteTypeOfProduct(
    typeId,
    userId,
  );

  if (!deleted) {
    throw new ProductTypesServiceError("Tipo de producto no encontrado", 404);
  }

  return typeId;
}
