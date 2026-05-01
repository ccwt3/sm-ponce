import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";

class ItemsDatabase {
  async _getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async getAllProducts() {
    const supabase = await this._getSupabaseClient();

    const { data: products, error } = await supabase
      .from("producto")
      .select("*");

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }

    console.log(products);
    return products as Product[];
  }
}

export default new ItemsDatabase();
