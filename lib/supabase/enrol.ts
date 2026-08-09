import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * A throwaway, session-less client, for exactly one job: creating somebody
 * else's login without disturbing the owner who is creating it.
 *
 * The cookie-bound client in `server.ts` cannot do this. Calling signUp on it
 * swaps the owner's cookies for the new account's, so an owner would add a
 * driver and find themselves signed in as that driver. This client persists
 * nothing, so the owner's session is never touched.
 *
 * The usual answer — `auth.admin.createUser` — needs the service-role key, and
 * AD-1 says that key never serves a user request. This needs no new privilege
 * at all: it can only do what any visitor to /signup can already do, which is
 * create an account with no restaurant attached. Attaching it to a restaurant
 * is a separate, owner-authenticated write that Row Level Security still polices
 * (see `profiles_owner_write`).
 */
export function createEnrolmentClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
