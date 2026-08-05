import "server-only";

/**
 * Every environment variable the app needs, declared in one place and checked
 * once at boot.
 *
 * architecture.md § Consistency Conventions: "a missing variable fails the boot
 * loudly, not the first request." A restaurant finding out at dinner service
 * that RESEND_API_KEY was never set is not an acceptable way to learn.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

/** Not needed until the contact form ships (story 8.4). */
const optional = ["RESEND_API_KEY", "SUPPORT_INBOX"] as const;

type Required = (typeof required)[number];
type Optional = (typeof optional)[number];

function read(): Record<Required, string> & Partial<Record<Optional, string>> {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.\n` +
        `Copy .env.example to .env.local and fill these in. ` +
        `The Supabase values are in your project's Settings → API.`,
    );
  }

  const out = {} as Record<string, string>;
  for (const key of [...required, ...optional]) {
    const value = process.env[key];
    if (value) out[key] = value;
  }
  return out as Record<Required, string> & Partial<Record<Optional, string>>;
}

export const env = read();
