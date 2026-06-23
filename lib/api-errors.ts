import "server-only";

import { NextResponse } from "next/server";

type HttpErrorCode =
  | "foreign_key_violation"
  | "invalid_input"
  | "not_found"
  | "unique_violation";

interface SupabaseErrorMessages {
  duplicate?: string;
  foreignKey?: string;
  invalidInput?: string;
  notFound?: string;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: HttpErrorCode,
  ) {
    super(message);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

function supabaseErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export function expectedSupabaseError(
  error: unknown,
  messages: SupabaseErrorMessages = {},
): HttpError | null {
  switch (supabaseErrorCode(error)) {
    case "23505":
      return new HttpError(
        messages.duplicate ?? "El registro ya existe",
        409,
        "unique_violation",
      );
    case "23503":
      return new HttpError(
        messages.foreignKey ??
          "No se puede completar la operacion por datos relacionados",
        409,
        "foreign_key_violation",
      );
    case "22P02":
      return new HttpError(
        messages.invalidInput ?? "Datos invalidos",
        400,
        "invalid_input",
      );
    case "PGRST116":
      return new HttpError(
        messages.notFound ?? "Registro no encontrado",
        404,
        "not_found",
      );
    default:
      return null;
  }
}

export function errorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  if (isHttpError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: fallbackMessage },
    { status: fallbackStatus },
  );
}
