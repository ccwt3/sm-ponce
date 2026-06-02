import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types";

class ProductTypesDatabase {
  async _getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async findType(
    value: string,
    userId: string,
  ): Promise<ProductType | null> {
    const supabase = await this._getSupabaseClient();

    const { data: type, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("tipo_de_producto", value)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product type:", error);
      throw new Error("Error fetching product type");
    }

    return type;
  }

  async getAllTypesOfProducts(): Promise<ProductType[]> {
    const supabase = await this._getSupabaseClient();

    const { data: types, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto");

    if (error) {
      console.error("Error fetching product types:", error);
      throw new Error("Error fetching product types");
    }

    return types ?? [];
  }

  async createTypeOfProduct({
    newProductType,
    userId,
  }: {
    newProductType: string;
    userId: string;
  }): Promise<ProductType> {
    const supabase = await this._getSupabaseClient();

    const { data: newType, error } = await supabase
      .from("tipo")
      .insert({ tipo_de_producto: newProductType, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Error creating product type:", error);
      throw new Error("Error creating product type");
    }

    return newType;
  }
}

const productTypesDatabase = new ProductTypesDatabase();

export default productTypesDatabase;
