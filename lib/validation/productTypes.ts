import { z } from "zod";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const productTypeSchema = z
  .string({ error: "Tipo de producto debe ser texto" })
  .trim()
  .min(1, { message: "Tipo de producto no puede estar vacio" });

export function validateProductTypeInput(
  input: unknown,
): ValidationResult<string> {
  const result = productTypeSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Tipo de producto invalido",
    };
  }

  return { success: true, data: result.data };
}
