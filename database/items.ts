import { createClient } from "@/lib/supabase/server";
import { expectedSupabaseError } from "@/lib/api-errors";
import {
  DEFAULT_PRODUCT_PAGE,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products.pagination";
import type {
  ProductRow,
  ProductUpdateWriteInput,
  ProductWriteInput,
  RawProduct,
} from "@/types";

const productRowSelect = `
  id,
  nombre,
  modelo,
  medida,
  tipo_id,
  existencia,
  precio_proveedor,
  precio_publico,
  user_id
`;

const productSelect = `
  ${productRowSelect},
  tipo (
    tipo_de_producto
  )
`;

interface ProductPageOptions {
  page?: number;
  search?: string;
  userId: string;
}

interface RawProductPage {
  products: RawProduct[];
  hasNextPage: boolean;
}

interface ProductSelectRow extends ProductRow {
  tipo:
    | { tipo_de_producto: string }
    | { tipo_de_producto: string }[]
    | null;
}

function productFromSelect(row: ProductSelectRow): RawProduct {
  return {
    id: row.id,
    nombre: row.nombre,
    modelo: row.modelo,
    medida: row.medida,
    tipo_id: row.tipo_id,
    existencia: row.existencia,
    precio_proveedor: row.precio_proveedor,
    precio_publico: row.precio_publico,
    user_id: row.user_id,
    tipo: Array.isArray(row.tipo) ? row.tipo[0] ?? null : row.tipo,
  };
}

function productDatabaseError(
  error: unknown,
  fallbackMessage: string,
  messages: Parameters<typeof expectedSupabaseError>[1] = {},
) {
  return expectedSupabaseError(error, messages) ?? new Error(fallbackMessage);
}

function quotedPostgrestValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

class ItemsDatabase {
  private async getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async getProductsPage({
    page = DEFAULT_PRODUCT_PAGE,
    search = "",
    userId,
  }: ProductPageOptions): Promise<RawProductPage> {
    const supabase = await this.getSupabaseClient();
    const pageStart = page * PRODUCT_PAGE_SIZE;
    const pageEnd = pageStart + PRODUCT_PAGE_SIZE;
    const normalizedSearch = search.trim();
    const matchingTypeIds = normalizedSearch
      ? await this.getMatchingTypeIds(normalizedSearch, userId)
      : [];

    let query = supabase
      .from("producto")
      .select(productSelect)
      .eq("user_id", userId)
      .order("id", { ascending: true });

    if (normalizedSearch) {
      const searchPattern = quotedPostgrestValue(`%${normalizedSearch}%`);
      const filters = [
        `nombre.ilike.${searchPattern}`,
        `modelo.ilike.${searchPattern}`,
        `medida.ilike.${searchPattern}`,
      ];

      if (matchingTypeIds.length > 0) {
        filters.push(`tipo_id.in.(${matchingTypeIds.join(",")})`);
      }

      query = query.or(filters.join(","));
    }

    const { data: products, error } = await query.range(pageStart, pageEnd);

    if (error) {
      console.error("Error al obtener productos:", error);
      throw productDatabaseError(error, "Error al obtener productos", {
        invalidInput: "Parametros de busqueda invalidos",
      });
    }

    const pageProducts = (products ?? []).map(productFromSelect);

    return {
      products: pageProducts.slice(0, PRODUCT_PAGE_SIZE),
      hasNextPage: pageProducts.length > PRODUCT_PAGE_SIZE,
    };
  }

  private async getMatchingTypeIds(
    search: string,
    userId: string,
  ): Promise<number[]> {
    const supabase = await this.getSupabaseClient();
    const { data: types, error } = await supabase
      .from("tipo")
      .select("id")
      .eq("user_id", userId)
      .ilike("tipo_de_producto", `%${search}%`);

    if (error) {
      console.error("Error al buscar tipos de producto:", error);
      throw productDatabaseError(error, "Error al buscar productos", {
        invalidInput: "Parametros de busqueda invalidos",
      });
    }

    return types?.map((type) => type.id) ?? [];
  }

  async getProductById(
    id: number,
    userId: string,
  ): Promise<RawProduct | null> {
    const supabase = await this.getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .select(productSelect)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener producto por ID:", error);
      throw productDatabaseError(error, "Error al obtener producto por ID", {
        invalidInput: "Id de producto invalido",
        notFound: "Producto no encontrado",
      });
    }

    return product ? productFromSelect(product) : null;
  }

  async createProduct(body: ProductWriteInput): Promise<ProductRow> {
    const supabase = await this.getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .insert(body)
      .select(productRowSelect)
      .single();

    if (error) {
      console.error("Error al crear producto:", error);
      throw productDatabaseError(error, "Error al crear producto", {
        duplicate: "Ya existe un producto con ese nombre",
        foreignKey: "El tipo de producto seleccionado no es valido",
        invalidInput: "Datos de producto invalidos",
      });
    }

    return product;
  }

  async updateProduct(
    body: ProductUpdateWriteInput,
    userId: string,
  ): Promise<ProductRow | null> {
    const supabase = await this.getSupabaseClient();
    const { id, ...updates } = body;

    const { data: product, error } = await supabase
      .from("producto")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select(productRowSelect)
      .maybeSingle();

    if (error) {
      console.error("Error al actualizar producto:", error);
      throw productDatabaseError(error, "Error al actualizar producto", {
        duplicate: "Ya existe un producto con ese nombre",
        foreignKey: "El tipo de producto seleccionado no es valido",
        invalidInput: "Datos de producto invalidos",
        notFound: "Producto no encontrado",
      });
    }

    return product;
  }

  async deleteProduct(id: number, userId: string): Promise<number | null> {
    const supabase = await this.getSupabaseClient();
    const { data: product, error } = await supabase
      .from("producto")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error al eliminar producto:", error);
      throw productDatabaseError(error, "Error al eliminar producto", {
        foreignKey:
          "No se puede eliminar el producto porque tiene datos relacionados",
        invalidInput: "Id de producto invalido",
        notFound: "Producto no encontrado",
      });
    }

    return product?.id ?? null;
  }
}

const itemsDatabase = new ItemsDatabase();

export default itemsDatabase;
