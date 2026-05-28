import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? "unknown_user";
}
