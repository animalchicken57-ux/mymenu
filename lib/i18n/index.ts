import { cookies } from "next/headers";

import { en, type Dictionary } from "./en";
import { ar } from "./ar";

export type Lang = "en" | "ar";
export type { Dictionary };

export const LANG_COOKIE = "mymenu_lang";

const dictionaries: Record<Lang, Dictionary> = { en, ar };

export function dictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function dir(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

function isLang(value: string | undefined): value is Lang {
  return value === "en" || value === "ar";
}

/**
 * Which language this request is in.
 *
 * A signed-in user's choice lives on their profile and is mirrored into this
 * cookie when they switch (story 7.2), so language resolution never needs a
 * database round trip on every render. A Diner has no account, so for them the
 * cookie is set from their browser's Accept-Language on first visit.
 */
export async function resolveLang(): Promise<Lang> {
  const store = await cookies();
  const chosen = store.get(LANG_COOKIE)?.value;
  return isLang(chosen) ? chosen : "en";
}

/** Convenience for a server component that wants both at once. */
export async function getT(): Promise<{ lang: Lang; t: Dictionary }> {
  const lang = await resolveLang();
  return { lang, t: dictionary(lang) };
}
