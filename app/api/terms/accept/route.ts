import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { getClientIp } from "@/lib/request-ip";
import { acceptCurrentTerms } from "@/lib/terms.service";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog-server";

/**
 * Registra la aceptacion de la version vigente de los terminos por el usuario
 * autenticado. El proxy ya exige sesion para `/api/*`; la version se fija en el
 * servidor y el RLS garantiza que solo se inserte para el propio usuario.
 */
export async function POST(req: NextRequest) {
  try {
    await acceptCurrentTerms(getClientIp(req));

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      captureServerEvent({
        distinctId: user.email,
        event: "terms_accepted",
        properties: { email: user.email },
      });
    }

    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    return errorResponse(error, "Error al registrar la aceptacion de terminos");
  }
}
