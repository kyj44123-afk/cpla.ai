import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/settings";

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const serviceRole = getSupabaseServiceRoleKey();

  if (!url || !serviceRole) {
    console.error("Supabase credentials missing. URL:", !!url, "Key:", !!serviceRole);
    // Return a dummy client or throw? Throwing is better to surface error.
    throw new Error(
      "Missing Supabase credentials. Please configure them in Admin > Settings."
    );
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

