import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PRODUCT_PAGE,
  PRODUCT_PAGE_SIZE,
} from "@/lib/products.pagination";
import type { ProductRow, ProductWriteInput, RawProduct } from "@/types";

const productRowSelect = `
  id,
  nombre,
  modelo,
  medida,
  tipo_id,
  existencia,
  precio_proveedor,
  precio_publico
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
    tipo: Array.isArray(row.tipo) ? row.tipo[0] ?? null : row.tipo,
  };
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
      throw new Error("Error al obtener productos");
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
  ): Promise<string[]> {
    const supabase = await this.getSupabaseClient();
    const { data: types, error } = await supabase
      .from("tipo")
      .select("id")
      .eq("user_id", userId)
      .ilike("tipo_de_producto", `%${search}%`);

    if (error) {
      console.error("Error al buscar tipos de producto:", error);
      throw new Error("Error al buscar productos");
    }

    return types?.map((type) => type.id) ?? [];
  }

  async getProductById(
    id: string,
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
      throw new Error("Error al obtener producto por ID");
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
      throw new Error("Error al crear producto");
    }

    return product;
  }

  async updateProduct(
    body: Partial<ProductWriteInput> & { id: string },
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
      throw new Error("Error al actualizar producto");
    }

    return product;
  }

  async deleteProduct(id: string, userId: string): Promise<string | null> {
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
      throw new Error("Error al eliminar producto");
    }

    return product?.id ?? null;
  }
}

const itemsDatabase = new ItemsDatabase();

export default itemsDatabase;
