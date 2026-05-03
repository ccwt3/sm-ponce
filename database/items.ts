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

    console.log(products);
    return products as RawProduct[];
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

    return product[0];
  }
}

export default new ItemsDatabase();
