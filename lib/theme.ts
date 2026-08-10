import "server-only";

import { cookies } from "next/headers";

/**
 * White or black, chosen by the person reading.
 *
 * Deliberately the same shape as `lib/i18n` — a cookie, resolved on the server,
 * stamped onto <html> during render. The alternative is reading localStorage in
 * the browser, which means the first paint is whatever the CSS defaulted to and
 * the correct theme arrives a frame later. A presenter switching to white in
 * front of a room does not want a black flash on every navigation.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "mymenu_theme";

function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * The reader's choice, or null when they have not made one — in which case no
 * attribute is written and `prefers-color-scheme` decides. Null is a real state
 * here, not a missing value: "follow my device" is the correct default and is
 * not the same as "light".
 */
export async function resolveTheme(): Promise<Theme | null> {
  const store = await cookies();
  const chosen = store.get(THEME_COOKIE)?.value;
  return isTheme(chosen) ? chosen : null;
}
