"use client";

import { useCallback } from "react";

import { createClient } from "@/lib/supabase/client";

export function useLogout() {
  return useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Prevent the next account from reusing the previous account's router cache.
    window.location.replace("/auth/login");
  }, []);
}
