import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types";

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

    const { data: type, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("tipo_de_producto", normalizedValue)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener tipo de producto:", error);
      throw new Error("Error al obtener tipo de producto");
    }

    return type;
  }

  async findTypeById(
    id: number,
    userId: string,
  ): Promise<ProductType | null> {
    const supabase = await this.getSupabaseClient();

    const { data: type, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("id", id)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener tipo de producto por ID:", error);
      throw new Error("Error al obtener tipo de producto");
    }

    return type;
  }

  async getAllTypesOfProducts(userId: string): Promise<ProductType[]> {
    const supabase = await this.getSupabaseClient();

    const { data: types, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("user_id", userId);

    if (error) {
      console.error("Error al obtener tipos de producto:", error);
      throw new Error("Error al obtener tipos de producto");
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
      .select("id, tipo_de_producto")
      .single();

    if (error) {
      console.error("Error al crear tipo de producto:", error);
      throw new Error("Error al crear tipo de producto");
    }

    return newType;
  }

  async deleteTypeOfProduct(id: number, userId: string): Promise<boolean> {
    const supabase = await this.getSupabaseClient();

    const { data: type, error } = await supabase
      .from("tipo")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error al eliminar tipo de producto:", error);
      throw new Error("Error al eliminar tipo de producto");
    }

    return Boolean(type);
  }
}

const productTypesDatabase = new ProductTypesDatabase();

export default productTypesDatabase;
