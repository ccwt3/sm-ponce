import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/proxy";
import { getClientIp } from "@/lib/request-ip";
import { recordAcceptanceAfterConfirmation } from "@/lib/terms.service";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Con la sesion ya establecida, graba la aceptacion si el usuario marco
      // el checkbox al registrarse. Es best-effort: el gate cubre lo demas.
      await recordAcceptanceAfterConfirmation(getClientIp(request));
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  redirect(`/auth/error?error=Falta el token o el tipo de confirmacion`);
}
