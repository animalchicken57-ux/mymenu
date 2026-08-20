import { cookies } from "next/headers";

import { en, type Dictionary } from "./en";
import { ar } from "./ar";
import { de } from "./de";
import { es } from "./es";
import { hi } from "./hi";
import { ru } from "./ru";
import { tr } from "./tr";
import { zh } from "./zh";
import { LANGS, LANGUAGE_NAMES, type Lang } from "./languages";

export type { Dictionary, Lang };
export { LANGS, LANGUAGE_NAMES };

export const LANG_COOKIE = "mymenu_lang";

const dictionaries: Record<Lang, Dictionary> = {
  en,
  ar,
  de,
  es,
  hi,
  ru,
  tr,
  zh,
};

export function dictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/** Arabic is the only right-to-left language offered so far. */
export function dir(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

function isLang(value: string | undefined): value is Lang {
  return value !== undefined && value in dictionaries;
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
