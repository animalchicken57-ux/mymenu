"use client";

import { useTransition } from "react";

import type { Lang } from "@/lib/i18n";

/**
 * The Diner's language switch — one tap, on the menu itself.
 *
 * The owner's switch lives in Settings behind a login, which is no use to the
 * person this dictionary was written for: a customer standing at a table with
 * no account. Without this, the Arabic menu could only be reached by editing a
 * cookie by hand.
 *
 * It writes the cookie directly rather than calling a server action. The cookie
 * is a preference, not a secret, and `document.cookie` plus a reload is the one
 * mechanism that cannot half-work — the whole page comes back in one language,
 * server-rendered, with the direction already flipped.
 *
 * Labelled with the language it will switch *to*, never the current one. A
 * button that says "English" while the page is in English tells you nothing.
 */
export function LanguageToggle({ lang }: { lang: Lang }) {
  const [pending, startTransition] = useTransition();
  const next: Lang = lang === "ar" ? "en" : "ar";

  function switchTo() {
    const year = 60 * 60 * 24 * 365;
    document.cookie = `mymenu_lang=${next}; path=/; max-age=${year}; samesite=lax`;
    startTransition(() => window.location.reload());
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      // lang on the button itself, so the Arabic word is shaped by an Arabic
      // font even while the page around it is still English.
      lang={next}
      className="min-h-touch shrink-0 rounded-full border border-border-hairline px-3 py-1 text-meta text-ink-secondary disabled:opacity-60"
    >
      {next === "ar" ? "عربي" : "English"}
    </button>
  );
}
