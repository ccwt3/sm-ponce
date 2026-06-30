"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

import { createClient } from "@/lib/supabase/client";

/**
 * Mantiene sincronizado el distinct ID de PostHog con la sesión de Supabase.
 *
 * Los formularios de login/registro llaman a `posthog.identify` al autenticarse,
 * pero un usuario que regresa con la sesión ya persistida en cookie no vuelve a
 * pasar por ese flujo, así que quedaría con un distinct ID anónimo. Este
 * componente cubre ese caso: al restaurarse la sesión en el cliente
 * (evento `INITIAL_SESSION`) identifica al usuario, y reacciona a futuros
 * cambios de sesión. Se usa el email como distinct ID para coincidir con
 * login-form y sign-up-form.
 *
 * No renderiza nada; se monta una sola vez en el layout raíz.
 */
export function PostHogAuthIdentifier() {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        posthog.reset();
        return;
      }

      const email = session?.user?.email;
      // Evita reidentificar en cada refresh de token si ya es el mismo usuario.
      if (email && posthog.get_distinct_id() !== email) {
        posthog.identify(email, { email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
