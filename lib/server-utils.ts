import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export class AuthRequiredError extends Error {
  readonly status = 401;

  constructor(message = "Debes iniciar sesion para continuar") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export async function requireCurrentUser(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthRequiredError();
  }

  return user;
}

export async function getCurrentUserId(): Promise<string> {
  const user = await requireCurrentUser();

  return user.id;
}
