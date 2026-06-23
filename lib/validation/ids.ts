type IdValidationResult =
  | { success: true; id: string }
  | { success: false; error: string };

const positiveIntegerPattern = /^\d+$/;

export function validateSupabaseTableId(value: string): IdValidationResult {
  if (!positiveIntegerPattern.test(value)) {
    return { success: false, error: "Id invalido" };
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return { success: false, error: "Id invalido" };
  }

  return { success: true, id: String(id) };
}
