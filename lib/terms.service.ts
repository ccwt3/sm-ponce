import "server-only";

import termsAcceptanceDatabase from "@/database/termsAcceptance";
import { HttpError } from "@/lib/api-errors";
import { requireCurrentUser } from "@/lib/server-utils";
import {
  CURRENT_TERMS_VERSION,
  TERMS_ACCEPTED_METADATA_KEY,
} from "@/lib/terms";

/**
 * Error de dominio para cuando el usuario autenticado todavia no acepta la
 * version vigente de los terminos. Se mapea a HTTP 403 por `errorResponse`.
 */
export class TermsRequiredError extends HttpError {
  constructor(
    message = "Debes aceptar los terminos y condiciones para continuar",
  ) {
    super(message, 403);
  }
}

/** Indica si el usuario actual acepto la version vigente de los terminos. */
export async function hasAcceptedCurrentTerms(): Promise<boolean> {
  const user = await requireCurrentUser();

  return termsAcceptanceDatabase.hasAccepted(user.id, CURRENT_TERMS_VERSION);
}

/**
 * Resuelve el usuario autenticado y exige que haya aceptado la version vigente.
 *
 * Lanza `AuthRequiredError` (401) si no hay sesion y `TermsRequiredError` (403)
 * si la sesion existe pero no ha aceptado. Devuelve el `userId` para que los
 * servicios de dominio lo usen igual que `getCurrentUserId()`.
 *
 * Este es el choke point que hace el gate no-bypasseable: todo acceso a datos
 * de dominio (SSR y API) pasa por aqui, asi que ni el frontend ni un curl
 * pueden operar sin una aceptacion registrada.
 */
export async function requireAcceptedTerms(): Promise<string> {
  const user = await requireCurrentUser();
  const accepted = await termsAcceptanceDatabase.hasAccepted(
    user.id,
    CURRENT_TERMS_VERSION,
  );

  if (!accepted) {
    throw new TermsRequiredError();
  }

  return user.id;
}

/** Registra la aceptacion de la version vigente por el usuario actual. */
export async function acceptCurrentTerms(
  ipAddress: string | null,
): Promise<void> {
  const user = await requireCurrentUser();

  await termsAcceptanceDatabase.recordAcceptance({
    userId: user.id,
    version: CURRENT_TERMS_VERSION,
    ipAddress,
  });
}

/**
 * Registra la aceptacion despues de confirmar el email, solo si el usuario
 * marco el checkbox de terminos durante el registro (queda en `user_metadata`).
 *
 * Es best-effort: nunca interrumpe la confirmacion de email. Si falla, el gate
 * server-side mostrara el popup de aceptacion la proxima vez. La version que se
 * persiste es la del servidor, no la enviada por el cliente.
 */
export async function recordAcceptanceAfterConfirmation(
  ipAddress: string | null,
): Promise<void> {
  try {
    const user = await requireCurrentUser();
    const acceptedAtSignUp =
      user.user_metadata?.[TERMS_ACCEPTED_METADATA_KEY] === true;

    if (!acceptedAtSignUp) {
      return;
    }

    await termsAcceptanceDatabase.recordAcceptance({
      userId: user.id,
      version: CURRENT_TERMS_VERSION,
      ipAddress,
    });
  } catch (error) {
    console.error(
      "No se pudo registrar la aceptacion de terminos tras confirmar email:",
      error,
    );
  }
}
