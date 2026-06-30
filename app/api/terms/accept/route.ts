import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-errors";
import { getClientIp } from "@/lib/request-ip";
import { acceptCurrentTerms } from "@/lib/terms.service";

/**
 * Registra la aceptacion de la version vigente de los terminos por el usuario
 * autenticado. El proxy ya exige sesion para `/api/*`; la version se fija en el
 * servidor y el RLS garantiza que solo se inserte para el propio usuario.
 */
export async function POST(req: NextRequest) {
  try {
    await acceptCurrentTerms(getClientIp(req));

    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    return errorResponse(error, "Error al registrar la aceptacion de terminos");
  }
}
