"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client, for client islands that need live updates (the Order Screen,
 * the Driver list, the Diner's status page).
 *
 * Only reads NEXT_PUBLIC_* values — architecture.md AD-9. Anything it can see,
 * a stranger with dev tools can see, which is exactly why Row Level Security is
 * where the real boundary lives.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
