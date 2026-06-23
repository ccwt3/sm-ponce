import { createClient } from "@/lib/supabase/server";
import { expectedSupabaseError } from "@/lib/api-errors";
import type { ProductType } from "@/types";

function productTypeDatabaseError(
  error: unknown,
  fallbackMessage: string,
  messages: Parameters<typeof expectedSupabaseError>[1] = {},
) {
  return expectedSupabaseError(error, messages) ?? new Error(fallbackMessage);
}

class ProductTypesDatabase {
  private async getSupabaseClient() {
    const supabase = await createClient();
    return supabase;
  }

  async findType(
    value: string,
    userId: string,
  ): Promise<ProductType | null> {
    const supabase = await this.getSupabaseClient();

    const { data: type, error } = await supabase
      .from("tipo")
      .select("id, tipo_de_producto")
      .eq("tipo_de_producto", value)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener tipo de producto:", error);
      throw productTypeDatabaseError(
        error,
        "Error al obtener tipo de producto",
        {
          invalidInput: "Tipo de producto invalido",
          notFound: "Tipo de producto no encontrado",
        },
      );
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
      throw productTypeDatabaseError(
        error,
        "Error al obtener tipo de producto",
        {
          invalidInput: "Id de tipo de producto invalido",
          notFound: "Tipo de producto no encontrado",
        },
      );
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
      throw productTypeDatabaseError(
        error,
        "Error al obtener tipos de producto",
        {
          invalidInput: "Parametros de tipos invalidos",
        },
      );
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
      throw productTypeDatabaseError(
        error,
        "Error al crear tipo de producto",
        {
          duplicate: "Ya existe un tipo de producto con ese nombre",
          foreignKey:
            "No se puede crear el tipo de producto con los datos actuales",
          invalidInput: "Tipo de producto invalido",
        },
      );
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
      throw productTypeDatabaseError(
        error,
        "Error al eliminar tipo de producto",
        {
          foreignKey:
            "No se puede eliminar el tipo porque esta relacionado con productos",
          invalidInput: "Id de tipo de producto invalido",
          notFound: "Tipo de producto no encontrado",
        },
      );
    }

    return Boolean(type);
  }
}

const productTypesDatabase = new ProductTypesDatabase();

export default productTypesDatabase;
