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
}

class ItemsDatabase {
  private async getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async getAllProducts({
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  }: ProductPageOptions = {}): Promise<RawProduct[]> {
    const supabase = await this.getSupabaseClient();

    const { data: products, error } = await supabase
      .from("producto")
      .select(productSelect)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }

    return products as RawProduct[];
  }

  async getProductById(id: string): Promise<RawProduct | null> {
    const supabase = await this.getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .select(productSelect)
      .eq("id", id)
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
  ): Promise<ProductRow> {
    const supabase = await this.getSupabaseClient();
    const { id, ...updates } = body;

    const { data: product, error } = await supabase
      .from("producto")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error("Error updating product");
    }

    return product;
  }

  async deleteProduct(id: string) {
    const supabase = await this.getSupabaseClient();
    const { error } = await supabase
      .from("producto")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw new Error("Error deleting product");
    }

    return id;
  }
}

const itemsDatabase = new ItemsDatabase();

export default itemsDatabase;
