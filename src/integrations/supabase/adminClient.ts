import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL } from "./client";

const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

/**
 * WARNING:
 * The service role key has full access to your Supabase project.
 * Never expose it in a public environment. This helper is intended for
 * trusted admin environments only. Ensure the key is stored securely.
 */
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-client-info": "estre-configurator-admin@1.0.0",
        },
      },
    })
  : null;

export const isServiceRoleConfigured = !!SUPABASE_SERVICE_ROLE_KEY;

