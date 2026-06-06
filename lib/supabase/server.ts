import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Crea un cliente nuevo por solicitud para conservar la sesion correcta. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Un Server Component no puede escribir cookies; el proxy las renueva.
          }
        },
      },
    },
  );
}
