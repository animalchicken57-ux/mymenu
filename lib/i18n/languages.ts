/**
 * Which languages exist, and what each is called in itself.
 *
 * Deliberately its own file, importing nothing. `index.ts` reaches for
 * `next/headers`, which a Client Component may not touch — the language
 * switcher is one, so it needs somewhere safe to read this list from.
 */

export type Lang = "en" | "ar" | "es" | "de" | "hi" | "zh" | "tr" | "ru";

/**
 * The name of each language written in that language, because a person looking
 * for their own language scans for the word they recognise, not for the English
 * name of it.
 *
 * Order is deliberate and it is the order the buttons appear in: English and
 * Arabic first because this is a UAE product, then the rest by their own name.
 */
export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  es: "Español",
  hi: "हिन्दी",
  ru: "Русский",
  tr: "Türkçe",
  zh: "中文",
};

/** Every language, in the order they should be offered. */
export const LANGS = Object.keys(LANGUAGE_NAMES) as Lang[];
