import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import { AppError } from "../core/errors/app-error.js";

let _supabaseAdmin: SupabaseClient | null = null;

export const SUPABASE_BUCKETS = {
  PREVIEWS: "sell-digital-assets-storage-previews",
  PRIVATE: "sell-digital-assets-storage-private",
} as const;

/**
 * Returns a singleton instance of the Supabase admin client configured with
 * SUPABASE_SERVICE_ROLE_KEY to perform privileged server-side storage operations
 * in the private bucket 'sell-digital-assets-storage-private' and manage public 'sell-digital-assets-storage-previews'.
 *
 * CAUTION: Never expose SUPABASE_SERVICE_ROLE_KEY to the client or browser!
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = env.SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new AppError(
        "CRITICAL SECURITY CONFIGURATION: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment variables for private asset storage operations.",
        500,
      );
    }

    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = {
  get client(): SupabaseClient {
    return getSupabaseAdmin();
  },
  get storage() {
    return getSupabaseAdmin().storage;
  },
};

