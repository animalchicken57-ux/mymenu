/**
 * Money. All of it.
 *
 * architecture.md AD-6: every monetary value is an integer count of fils —
 * 45.50 AED is 4550 — in the database, in transit, and in domain code. No float
 * arithmetic on currency happens anywhere outside this module.
 *
 * The reason is not theoretical. The Savings Counter is the whole pitch, and a
 * counter that is one fil out is a counter the owner stops believing.
 */

export const FILS_PER_DIRHAM = 100;

/** "45.5", "45.50", "٤٥٫٥" → 4550. Returns null if it is not a price. */
export function parseDirhams(input: string): number | null {
  const normalised = input
    .trim()
    // Arabic-Indic digits, which a UAE owner's keyboard may well produce.
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫،]/g, ".")
    .replace(/,/g, "");

  if (!/^\d+(\.\d{0,2})?$/.test(normalised)) return null;

  const [whole, fraction = ""] = normalised.split(".");
  const fils = Number(whole) * FILS_PER_DIRHAM + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(fils) ? fils : null;
}

/** 4550 → "45.50". The number only — the currency word is the caller's job. */
export function formatFils(fils: number): string {
  const negative = fils < 0;
  const abs = Math.abs(Math.round(fils));
  const whole = Math.floor(abs / FILS_PER_DIRHAM);
  const part = abs % FILS_PER_DIRHAM;

  const grouped = whole.toLocaleString("en-US");
  return `${negative ? "-" : ""}${grouped}.${String(part).padStart(2, "0")}`;
}

/**
 * 870_000 → "8,700 AED". For the Savings Counter and the landing figure, where
 * fils are noise — nobody says "you kept eight thousand seven hundred dirhams
 * and forty fils".
 */
export function formatDirhamsRounded(fils: number): string {
  const dirhams = Math.round(fils / FILS_PER_DIRHAM);
  return `${dirhams.toLocaleString("en-US")} AED`;
}

/** Line total. Integer in, integer out, no float ever touches it. */
export function lineTotal(unitPriceFils: number, quantity: number): number {
  return Math.round(unitPriceFils) * Math.round(quantity);
}

export function cartTotal(
  lines: ReadonlyArray<{ unitPriceFils: number; quantity: number }>,
): number {
  return lines.reduce(
    (sum, line) => sum + lineTotal(line.unitPriceFils, line.quantity),
    0,
  );
}
