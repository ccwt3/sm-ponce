"use client";

import { useState } from "react";
import posthog from "posthog-js";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PRIVACY_URL, TERMS_URL } from "@/lib/terms";

/** Logo oficial de Google en SVG para evitar una dependencia de iconos. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Boton de inicio de sesion con Google. Dispara el flujo OAuth de Supabase, que
 * redirige a Google y regresa a `/auth/callback`. La captura de PostHog y el
 * registro de terminos ocurren en el callback server-side, no aqui, porque el
 * redirect saca al navegador de la app antes de que corra cualquier codigo.
 *
 * Los usuarios de Google no ven el checkbox de terminos del registro, por eso
 * el aviso legal se muestra junto al boton: al continuar aceptan la version
 * vigente, y el callback graba esa aceptacion.
 */
export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      // Conserva el destino solicitado (?next=...) cuando existe; en el registro
      // no hay `next` y el callback cae a /home por getSafeRedirectPath.
      const next = new URLSearchParams(window.location.search).get("next");
      if (next) {
        redirectTo.searchParams.set("next", next);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });
      if (error) throw error;
      // El navegador ya esta redirigiendo a Google; no hay mas trabajo aqui.
    } catch (e: unknown) {
      posthog.captureException(e);
      setError(
        e instanceof Error ? e.message : "No se pudo continuar con Google",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <GoogleIcon />
        {isLoading ? "Redirigiendo..." : "Continuar con Google"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        Al continuar con Google aceptas los{" "}
        <a
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Términos de Servicio
        </a>{" "}
        y el{" "}
        <a
          href={PRIVACY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Aviso de Privacidad
        </a>
        .
      </p>
    </div>
  );
}
