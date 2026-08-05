import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security entirely.
 *
 * architecture.md AD-1: "the service-role key is never used to serve a user
 * request — only in migrations and scheduled jobs." In practice that means the
 * seed script (story 9.1) and nothing else. If you find yourself reaching for
 * this to make a page work, the page is wrong, not the policy.
 *
 * It is a function rather than a module-level constant so that importing this
 * file does not throw in an environment that has no service-role key — which is
 * every environment except a developer's laptop.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is only needed for migrations " +
        "and the seed script. Copy it from Supabase → Settings → API Keys → " +
        "secret, into .env.local.",
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
