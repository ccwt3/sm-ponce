import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - ingest (proxy de PostHog: la ingesta de analytics no debe pasar por
     *   auth; si no se excluye, las peticiones de usuarios no autenticados se
     *   redirigen a /auth/login y PostHog recibe HTML en vez de JSON).
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
