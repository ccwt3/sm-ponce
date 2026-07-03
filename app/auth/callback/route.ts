import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/proxy";
import { getClientIp } from "@/lib/request-ip";
import { captureServerEvent } from "@/lib/posthog-server";
import {
  acceptCurrentTerms,
  hasAcceptedCurrentTerms,
} from "@/lib/terms.service";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Callback de OAuth (Google). El proveedor regresa con un `code` PKCE que aqui
 * se intercambia por una sesion. Es el equivalente de `/auth/confirm` para el
 * flujo social: como el redirect saca al usuario de la app, ningun formulario
 * cliente corre, asi que este es el punto server-side donde se registra la
 * telemetria y la aceptacion de terminos.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (!code) {
    redirect(`/auth/error?error=Falta el codigo de autorizacion`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`/auth/error?error=${error.message}`);
  }

  const email = data.user?.email;

  // Los usuarios de Google no pasan por el checkbox del registro, asi que se
  // graba la aceptacion aqui (el boton de Google muestra el aviso legal). Es
  // best-effort: si falla, el popup no-descartable de /home queda como respaldo.
  try {
    if (!(await hasAcceptedCurrentTerms())) {
      await acceptCurrentTerms(getClientIp(request));
      if (email) {
        captureServerEvent({
          distinctId: email,
          event: "terms_accepted",
          properties: { email, method: "google" },
        });
      }
    }
  } catch (termsError) {
    console.error(
      "No se pudo registrar la aceptacion de terminos tras OAuth:",
      termsError,
    );
  }

  if (email) {
    captureServerEvent({
      distinctId: email,
      event: "user_signed_in",
      properties: { email, method: "google" },
    });
  }

  redirect(next);
}
