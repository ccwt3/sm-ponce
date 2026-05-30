import "server-only";

import itemsDatabase from "@/database/items";
import type { Product, RawProduct } from "@/types";

export function normalizeProduct(product: RawProduct): Product {
  const { tipo, ...rest } = product;

  return {
    ...rest,
    tipo_id: tipo?.tipo_de_producto ?? "Sin tipo",
  };
}

export async function getProductsForDashboard(): Promise<Product[]> {
  const rawProducts = await itemsDatabase.getAllProducts();

  return rawProducts.map(normalizeProduct);
}
