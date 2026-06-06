"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function useLogout() {
  const router = useRouter();

  return useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    router.push("/auth/login");
    router.refresh();
  }, [router]);
}
