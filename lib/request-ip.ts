import { type NextRequest } from "next/server";

/**
 * Obtiene la IP del cliente de los headers que coloca la plataforma de deploy
 * (Vercel). Devuelve solo la primera entrada de `x-forwarded-for` para que sea
 * un valor `inet` valido en Postgres; si no hay informacion, devuelve `null`.
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip");
}
