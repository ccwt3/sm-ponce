/**
 * Constantes compartidas de los Terminos de Servicio y Aviso de Privacidad.
 *
 * Este modulo no importa `server-only` a proposito: lo consumen tanto el
 * cliente (formulario de registro, popup de aceptacion) como el servidor
 * (confirmacion de email, gate de dominio). La version vigente vive aqui como
 * unica fuente de verdad.
 */

/** Version vigente de los terminos. Coincide con la fecha de los HTML legales. */
export const CURRENT_TERMS_VERSION = "2026-06-29";

/** Documentos legales servidos como estaticos desde `public/`. */
export const TERMS_URL = "/terms.html";
export const PRIVACY_URL = "/privacy.html";

/**
 * Claves de `user_metadata` donde el registro guarda la intencion de aceptar.
 * Se leen en la confirmacion de email para grabar la aceptacion. Son una
 * conveniencia de UX: el gate server-side sigue siendo la frontera real.
 */
export const TERMS_ACCEPTED_METADATA_KEY = "terms_accepted";
export const TERMS_VERSION_METADATA_KEY = "terms_version";
