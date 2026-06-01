import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import type { CreateProductInput, RawProduct } from "@/types";

class ItemsDatabase {
  async _getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async getAllProducts(): Promise<RawProduct[]> {
    const supabase = await this._getSupabaseClient();
    const page = 0;
    const pageSize = 50;

    const { data: products, error } = await supabase
      .from("producto")
      .select(
        `
        *,
        tipo (
        tipo_de_producto
        )
      `,
      )
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }

    return products as RawProduct[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const supabase = await this._getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product by ID:", error);
      throw new Error("Error fetching product by ID");
    }

    return product;
  }

  async createProduct(body: CreateProductInput) {
    const supabase = await this._getSupabaseClient();

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

  async updateProduct(body: Partial<CreateProductInput> & { id: string }) {
    const supabase = await this._getSupabaseClient();

    const { data: product, error } = await supabase
      .from("producto")
      .update(body)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error("Error updating product");
    }

    return product;
  }

  async deleteProduct(id: string) {
    const supabase = await this._getSupabaseClient(); 
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

export default new ItemsDatabase();
