"use client";

import { useCallback } from "react";

import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

export function useLogout() {
  return useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    posthog.capture("user_signed_out");
    posthog.reset();

    // Prevent the next account from reusing the previous account's router cache.
    window.location.replace("/auth/login");
  }, []);
}
