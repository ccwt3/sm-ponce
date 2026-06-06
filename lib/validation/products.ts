import { z } from "zod";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const fieldLabels: Record<string, string> = {
  existencia: "Existencia",
  medida: "Medida",
  modelo: "Modelo",
  nombre: "Nombre",
  precio_proveedor: "Precio proveedor",
  precio_publico: "Precio publico",
  tipo_id: "Tipo de producto",
};

function fieldLabel(field: string): string {
  return fieldLabels[field] ?? field;
}

const requiredText = (field: string) =>
  z
    .string({ error: `${fieldLabel(field)} debe ser texto` })
    .trim()
    .min(1, { message: `${fieldLabel(field)} no puede estar vacio` });

const nullableText = (field: string) =>
  z
    .union([
      z.string({ error: `${fieldLabel(field)} debe ser texto` }),
      z.null(),
      z.undefined(),
    ])
    .transform((value) => {
      if (value == null) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    });

const parseNumberInput = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? Number(trimmed) : undefined;
  }

  return value;
};

const requiredNumber = (field: string) =>
  z.preprocess(
    parseNumberInput,
    z
      .number({ error: `${fieldLabel(field)} debe ser numerico` })
      .finite({ message: `${fieldLabel(field)} debe ser numerico` })
      .nonnegative({ message: `${fieldLabel(field)} no puede ser negativo` }),
  );

const requiredInteger = (field: string) =>
  requiredNumber(field).pipe(
    z
      .number()
      .int({ message: `${fieldLabel(field)} debe ser un numero entero` }),
  );

const productCreateSchema = z.object({
  nombre: requiredText("nombre"),
  modelo: nullableText("modelo"),
  medida: nullableText("medida"),
  tipo_id: requiredText("tipo_id"),
  existencia: requiredInteger("existencia"),
  precio_proveedor: requiredNumber("precio_proveedor"),
  precio_publico: requiredNumber("precio_publico"),
});

const productUpdateSchema = productCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay campos validos para actualizar",
  });

type ProductInput = z.infer<typeof productCreateSchema>;
type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

function firstValidationError(error: z.ZodError): string {
  const issue = error.issues[0];

  if (!issue) {
    return "Payload invalido";
  }

  return issue.message;
}

export function validateCreateProductInput(
  input: unknown,
): ValidationResult<ProductInput> {
  const result = productCreateSchema.safeParse(input);

  if (!result.success) {
    return { success: false, error: firstValidationError(result.error) };
  }

  return { success: true, data: result.data };
}

export function validateUpdateProductInput(
  input: unknown,
): ValidationResult<ProductUpdateInput> {
  const result = productUpdateSchema.safeParse(input);

  if (!result.success) {
    return { success: false, error: firstValidationError(result.error) };
  }

  return { success: true, data: result.data };
}
