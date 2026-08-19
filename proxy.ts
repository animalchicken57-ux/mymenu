import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page render.
 *
 * Two jobs, and deliberately no more:
 *  1. Refresh the Supabase session and write the rotated cookies onto the
 *     response. Server Components cannot set cookies, so if this did not happen
 *     here, sessions would silently expire mid-shift.
 *  2. Send a signed-out visitor away from an authenticated URL.
 *
 * It does NOT decide what a role may do. That is story 1.8's job, in the page
 * itself and in Row Level Security, because a proxy that thinks it is the
 * security boundary is a proxy one rewrite away from being wrong.
 */

const AUTHENTICATED_PREFIXES = [
  "/dashboard",
  "/menu",
  "/orders",
  "/customers",
  "/kitchen",
  "/deliveries",
  "/team",
  "/settings",
];

const AUTH_PAGES = ["/login", "/signup", "/forgot"];

/** Cookie name, duplicated from lib/i18n — the proxy runs on the edge and must
 *  not drag a module that reaches for `next/headers`. */
const LANG_COOKIE = "mymenu_lang";

/**
 * Does this browser ask for Arabic first?
 *
 * `resolveLang()` has always claimed the cookie is "set from Accept-Language on
 * first visit", and nothing ever did it — a diner got English no matter what
 * their phone was set to, which made the whole Arabic dictionary unreachable
 * for the only person it was written for. This is the missing half.
 *
 * Only the first-listed language counts. A header of "en,ar" means a person who
 * would rather read English, and guessing otherwise is worse than doing nothing.
 */
function prefersArabic(header: string | null): boolean {
  if (!header) return false;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first === "ar" || first.startsWith("ar-");
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() and not getSession(): this one verifies the token with Supabase
  // rather than trusting whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = AUTHENTICATED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // First visit, no choice on record: take the browser's word for it. Written
  // only when the cookie is absent, so it can never overrule a person who has
  // actually picked a language — theirs stays picked.
  if (!request.cookies.get(LANG_COOKIE)) {
    response.cookies.set(
      LANG_COOKIE,
      prefersArabic(request.headers.get("accept-language")) ? "ar" : "en",
      { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 },
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
