import type { Lang } from "./languages";

/**
 * Filling words into sentences, without putting functions in the dictionary.
 *
 * The dictionary used to hold functions — `tableLabel: (n) => \`Table ${n}\`` —
 * which reads beautifully and cannot cross a Server Component boundary. React
 * refuses to serialise a function into a Client Component, so the whole
 * ordering page returned a 500 the moment it was deployed. The dictionary now
 * holds plain strings with `{placeholders}`, and the filling happens here.
 *
 * These are imported, never passed as props. An import is code; a prop is data.
 */

/** `fill("Table {n}", { n: 4 })` → `"Table 4"`. Leaves unknown braces alone. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/**
 * Languages count in different numbers of shapes, and picking the shape is a
 * language rule, so it lives with the language and not in a component.
 *
 * - Arabic has four: one, two, a few (3–10), then a singular-looking form again
 *   above ten.
 * - Russian has three, and the rule reads the last digit rather than the size
 *   of the number: 1 but not 11, then 2–4 but not 12–14, then everything else.
 *   This is why the Russian dictionary writes its `one` and `two` forms with
 *   `{n}` instead of a literal digit — 21 takes the same shape as 1.
 * - Turkish and Chinese have none at all. Their dictionaries repeat the same
 *   sentence in all four slots on purpose, so the English rule below returns
 *   the right string without needing a case of its own.
 * - English, Spanish, German and Hindi have two.
 */
export function plural(
  lang: Lang,
  n: number,
  forms: { one: string; two: string; few: string; many: string },
): string {
  if (lang === "ar") {
    if (n === 1) return forms.one;
    if (n === 2) return forms.two;
    if (n >= 3 && n <= 10) return forms.few;
    return forms.many;
  }

  if (lang === "ru") {
    const lastDigit = n % 10;
    const lastTwo = n % 100;
    if (lastDigit === 1 && lastTwo !== 11) return forms.one;
    if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
      return forms.few;
    }
    return forms.many;
  }

  return n === 1 ? forms.one : forms.many;
}
