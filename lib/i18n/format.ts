import type { Lang } from "./index";

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
 * Arabic counts in more shapes than English does: one, two, a few (3–10), then
 * back to a singular-looking form above ten. English has two. Picking the form
 * is a language rule, so it lives with the language and not in a component.
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
  return n === 1 ? forms.one : forms.many;
}
