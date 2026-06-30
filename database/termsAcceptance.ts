import { createClient } from "@/lib/supabase/server";
import { expectedSupabaseError } from "@/lib/api-errors";

function termsAcceptanceDatabaseError(error: unknown, fallbackMessage: string) {
  return expectedSupabaseError(error) ?? new Error(fallbackMessage);
}

/**
 * Acceso a datos de `terms_acceptance`. El modelo es append-only: una fila por
 * combinacion `(user_id, terms_version)`. La unicidad la garantiza la base con
 * `unique (user_id, terms_version)`, lo que permite versionar los terminos sin
 * necesidad de una policy UPDATE (el RLS solo expone insert y select).
 */
class TermsAcceptanceDatabase {
  private async getSupabaseClient() {
    return createClient();
  }

  /** Indica si el usuario ya acepto la version indicada. */
  async hasAccepted(userId: string, version: string): Promise<boolean> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase
      .from("terms_acceptance")
      .select("id")
      .eq("user_id", userId)
      .eq("terms_version", version)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al verificar aceptacion de terminos:", error);
      throw termsAcceptanceDatabaseError(
        error,
        "Error al verificar la aceptacion de terminos",
      );
    }

    return Boolean(data);
  }

  /**
   * Registra la aceptacion de una version. Es idempotente: si la fila
   * `(user_id, terms_version)` ya existe (codigo 23505), no es un error.
   * El `user_id` lo refuerza el RLS con `auth.uid()`.
   */
  async recordAcceptance(input: {
    userId: string;
    version: string;
    ipAddress: string | null;
  }): Promise<void> {
    const supabase = await this.getSupabaseClient();

    const { error } = await supabase.from("terms_acceptance").insert({
      user_id: input.userId,
      terms_version: input.version,
      ip_address: input.ipAddress,
    });

    if (!error) {
      return;
    }

    // Duplicado: el usuario ya habia aceptado esta version. No es un error.
    if (expectedSupabaseError(error)?.code === "unique_violation") {
      return;
    }

    console.error("Error al registrar aceptacion de terminos:", error);
    throw termsAcceptanceDatabaseError(
      error,
      "Error al registrar la aceptacion de terminos",
    );
  }
}

const termsAcceptanceDatabase = new TermsAcceptanceDatabase();

export default termsAcceptanceDatabase;
