import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ProductTypesDatabase {
  private async getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async findType(
    value: string,
    userId: string,
  ): Promise<ProductType | null> {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    const supabase = await this.getSupabaseClient();

    if (uuidPattern.test(normalizedValue)) {
      const { data: typeById, error: idError } = await supabase
        .from("tipo")
        .select("id, tipo_de_producto")
        .eq("id", normalizedValue)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (idError) {
        console.error("Error fetching product type by id:", idError);
        throw new Error("Error fetching product type");
      }

      if (typeById) {
        return typeById;
      }
    }

    const { data: type, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("tipo_de_producto", normalizedValue)
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
    const supabase = await this.getSupabaseClient();

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
    const supabase = await this.getSupabaseClient();

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
