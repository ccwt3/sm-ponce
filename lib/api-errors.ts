import "server-only";

import { NextResponse } from "next/server";

type HttpError = Error & { status: number };

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    typeof (error as { status?: unknown }).status === "number"
  );
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
