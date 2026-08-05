import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * The cookie-bound client. Carries the signed-in user's session, so every query
 * it makes is subject to Row Level Security (architecture.md AD-1, AD-9).
 *
 * This is the only Supabase client that may serve a user request. The other one
 * is `admin.ts`, and it is for migrations and seeding only.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. That is fine: proxy.ts
            // refreshes the session on every request, so the write always has
            // somewhere legitimate to happen.
          }
        },
      },
    },
  );
}
