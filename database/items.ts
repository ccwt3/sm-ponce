import { createClient } from "@/lib/supabase/server";
import type { ProductRow, ProductWriteInput, RawProduct } from "@/types";

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 50;

const productSelect = `
  *,
  tipo (
    tipo_de_producto
  )
`;

interface ProductPageOptions {
  page?: number;
  pageSize?: number;
  userId: string;
}

class ItemsDatabase {
  private async getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async getAllProducts({
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    userId,
  }: ProductPageOptions): Promise<RawProduct[]> {
    const supabase = await this.getSupabaseClient();

    const { data: products, error } = await supabase
      .from("producto")
      .select(productSelect)
      .eq("user_id", userId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }

    return products as RawProduct[];
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
      console.error("Error fetching product by ID:", error);
      throw new Error("Error fetching product by ID");
    }

    return product;
  }

  async createProduct(body: ProductWriteInput): Promise<ProductRow> {
    const supabase = await this.getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw new Error("Error creating product");
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
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error("Error updating product");
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
      console.error("Error deleting product:", error);
      throw new Error("Error deleting product");
    }

    return product?.id ?? null;
  }
}

const itemsDatabase = new ItemsDatabase();

export default itemsDatabase;
