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
] as const;

/**
 * Deliberately not required to serve a request.
 *
 * - SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security, so per AD-9 it is
 *   only ever read by migrations and the seed script. Keeping it out of the
 *   required set means a normal boot cannot depend on it, which is one fewer
 *   way for it to end up somewhere it shouldn't.
 * - RESEND_API_KEY / SUPPORT_INBOX are not needed until the contact form
 *   ships (story 8.4).
 */
const optional = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "SUPPORT_INBOX",
  "NEXT_PUBLIC_SITE_URL",
  // Set by Vercel itself. The first is the stable production domain; the
  // second changes on every deployment, so it is only a fallback.
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;

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

/**
 * This site's own address, for links that have to work when they arrive in
 * somebody's inbox or get printed onto a table.
 *
 * Not a required variable, because on Vercel it is already known and asking
 * someone to type their own deployment URL into their own deployment is a step
 * that exists only to be got wrong. NEXT_PUBLIC_SITE_URL still wins when it is
 * set — a custom domain has to be able to override the vercel.app one.
 */
export function siteUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;

  // The stable production domain. Stays put across deployments, which is what
  // a password-reset link in a two-day-old email needs.
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // A per-deployment URL. Right for a preview build, wrong for anything
  // durable, so it comes last.
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  return "http://localhost:3000";
}
